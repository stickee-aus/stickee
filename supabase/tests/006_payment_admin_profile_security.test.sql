-- Run only against a disposable local Supabase database after migration 027.
begin;

do $$
begin
  if has_table_privilege('authenticated', 'public.donation_records', 'INSERT') then
    raise exception 'authenticated can forge donation records';
  end if;
  if has_table_privilege('authenticated', 'public.notifications', 'INSERT') then
    raise exception 'authenticated can forge notifications';
  end if;
  if has_column_privilege('authenticated', 'public.notifications', 'title', 'UPDATE') then
    raise exception 'authenticated can rewrite notification content';
  end if;
  if not has_column_privilege('authenticated', 'public.notifications', 'read', 'UPDATE') then
    raise exception 'authenticated cannot mark notifications read';
  end if;
  if has_column_privilege('authenticated', 'public.user_profiles', 'civic_score', 'UPDATE') then
    raise exception 'authenticated can self-award civic score';
  end if;
  if not has_column_privilege('authenticated', 'public.user_profiles', 'display_name', 'UPDATE') then
    raise exception 'ordinary profile edits were accidentally removed';
  end if;
  if not has_function_privilege('anon', 'public.is_app_admin()', 'EXECUTE') then
    raise exception 'anon cannot evaluate fixture-filtering RLS policies';
  end if;
  if has_function_privilege('authenticated', 'public.increment_feed_count(text,text)', 'EXECUTE') then
    raise exception 'authenticated can mutate feed counters directly';
  end if;
end;
$$;

select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;

do $$
begin
  if not public.claim_stripe_webhook_event('evt_securityfixture1', 'checkout.session.completed', 'cs_test_fixture1', false) then
    raise exception 'first Stripe event claim failed';
  end if;
  if public.claim_stripe_webhook_event('evt_securityfixture1', 'checkout.session.completed', 'cs_test_fixture1', false) then
    raise exception 'concurrent duplicate Stripe event was claimed';
  end if;

  update public.stripe_webhook_events
  set status = 'failed'
  where event_id = 'evt_securityfixture1';

  if not public.claim_stripe_webhook_event('evt_securityfixture1', 'checkout.session.completed', 'cs_test_fixture1', false) then
    raise exception 'failed Stripe event was not retryable';
  end if;
end;
$$;

rollback;
