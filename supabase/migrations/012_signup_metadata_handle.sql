-- ──────────────────────────────────────────────────────────────────────────
-- 012_signup_metadata_handle.sql
--
-- The new multi-step sign-up flow lets users pick their own handle and
-- display name. Both are passed into supabase.auth.signUp({ options: { data }})
-- which lands in raw_user_meta_data. This trigger reads them when present
-- and falls back to the previous email-derived behaviour otherwise.
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_handle      text;
  meta_display     text;
  base_handle      text;
  candidate_handle text;
  user_suffix      text;
  attempt          integer := 0;
begin
  insert into public.user_wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  -- ── Pull whatever the client supplied ──────────────────────────────
  meta_handle := nullif(
    lower(regexp_replace(coalesce(new.raw_user_meta_data->>'handle', ''), '[^a-z0-9_]', '', 'g')),
    ''
  );
  meta_display := nullif(
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name'
    ),
    ''
  );

  -- ── Decide on a starting handle ────────────────────────────────────
  if meta_handle is not null and char_length(meta_handle) between 3 and 20 then
    base_handle := meta_handle;
  else
    base_handle := lower(regexp_replace(coalesce(split_part(new.email, '@', 1), ''), '[^a-z0-9]', '', 'g'));
    if base_handle = '' then
      base_handle := 'user';
    end if;
  end if;

  candidate_handle := base_handle;
  user_suffix := substr(replace(new.id::text, '-', ''), 1, 8);

  -- ── Insert profile, falling back to suffixed handles on collision ──
  loop
    begin
      insert into public.user_profiles (user_id, handle, display_name)
      values (
        new.id,
        candidate_handle,
        coalesce(meta_display, split_part(new.email, '@', 1), candidate_handle)
      )
      on conflict (user_id) do nothing;

      exit;
    exception
      when unique_violation then
        attempt := attempt + 1;
        if attempt = 1 then
          candidate_handle := base_handle || '_' || user_suffix;
        else
          candidate_handle := base_handle || '_' || user_suffix || '_' || attempt::text;
        end if;
    end;
  end loop;

  insert into public.notifications (user_id, type, title, body, href)
  values (
    new.id,
    'bonus',
    'Welcome to Stickee!',
    'Your civic identity is ready. Start with 5,000 prediction points and make your first stake.',
    '/predictions'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
