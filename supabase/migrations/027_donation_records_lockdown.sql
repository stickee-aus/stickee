-- 027: donation_records is written only by the server (service role).
-- Checkout inserts 'started' rows and the signed Stripe webhook sets
-- paid / failed / refunded. Signed-in users and anon get no write access, so
-- nobody can mark their own donation as paid or refunded through the public
-- Supabase API. Users can still read their own rows (policy kept).
-- service_role bypasses RLS and keeps its grants.
-- No data is deleted or altered.

drop policy if exists "Users can create own donation records" on public.donation_records;
drop policy if exists "Admins can update donation records" on public.donation_records;

revoke insert, update, delete, truncate, references, trigger on public.donation_records from anon, authenticated;
revoke select on public.donation_records from anon;
