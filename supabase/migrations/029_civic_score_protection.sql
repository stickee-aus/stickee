-- 029: users must not set their own civic_score.
-- The "Users can manage own profile" policy covers every column, so a trigger
-- pins civic_score for the API roles (anon / authenticated). The service
-- role, postgres and SECURITY DEFINER functions (current_user = owner) are
-- unaffected. The old value is kept silently so whole-row profile saves keep
-- working.

create or replace function public.protect_civic_score()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.civic_score := 0;
    elsif new.civic_score is distinct from old.civic_score then
      new.civic_score := old.civic_score;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_civic_score on public.user_profiles;
create trigger protect_civic_score
  before insert or update on public.user_profiles
  for each row execute function public.protect_civic_score();

revoke execute on function public.protect_civic_score() from public, anon, authenticated;
