-- Make auth signup resilient when multiple emails share the same local-part.
-- The previous trigger derived handle directly from the email local-part and
-- only handled conflicts on user_id, so a duplicate handle could abort the
-- auth.users insert with "Database error saving new user".

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_handle text;
  candidate_handle text;
  user_suffix text;
  attempt integer := 0;
begin
  insert into public.user_wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  base_handle := lower(regexp_replace(coalesce(split_part(new.email, '@', 1), ''), '[^a-z0-9]', '', 'g'));
  if base_handle = '' then
    base_handle := 'user';
  end if;

  candidate_handle := base_handle;
  user_suffix := substr(replace(new.id::text, '-', ''), 1, 8);

  loop
    begin
      insert into public.user_profiles (user_id, handle, display_name)
      values (
        new.id,
        candidate_handle,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), candidate_handle)
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
