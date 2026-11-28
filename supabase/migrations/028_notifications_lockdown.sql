-- 028: notifications. Remove the open `with check (true)` insert policy that
-- let anon and any signed-in user create notifications for any user.
-- A signed-in user may insert only for themselves (used by the client-side
-- push() in src/hooks/useNotifications.ts). Server code uses the service role
-- (bypasses RLS); handle_new_user() is SECURITY DEFINER.
-- No data is deleted or altered.

drop policy if exists "Service role can insert notifications" on public.notifications;

create policy "Users can insert own notifications"
  on public.notifications for insert
  to authenticated
  with check (auth.uid() = user_id);

revoke insert, delete, truncate, references, trigger on public.notifications from anon;
revoke truncate, references, trigger on public.notifications from authenticated;
revoke select, update on public.notifications from anon;
