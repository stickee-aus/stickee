-- ─────────────────────────────────────────────────────────────────────────────
-- 015_feed_rpc.sql
-- Helper RPCs for atomic feed_posts count increments/decrements.
-- Called by the /api/feed/react route (service role).
-- ─────────────────────────────────────────────────────────────────────────────

-- Generic increment (hearts / fires / flags / comment_count / share_count)
create or replace function public.increment_feed_count(p_post_id text, p_col text)
returns void
language plpgsql
security definer
as $$
begin
  if p_col = 'hearts' then
    update feed_posts set hearts = hearts + 1 where id = p_post_id;
  elsif p_col = 'fires' then
    update feed_posts set fires = fires + 1 where id = p_post_id;
  elsif p_col = 'flags' then
    update feed_posts set flags = flags + 1 where id = p_post_id;
  elsif p_col = 'comment_count' then
    update feed_posts set comment_count = comment_count + 1 where id = p_post_id;
  elsif p_col = 'share_count' then
    update feed_posts set share_count = share_count + 1 where id = p_post_id;
  end if;
end;
$$;

-- Generic decrement (floors at 0)
create or replace function public.decrement_feed_count(p_post_id text, p_col text)
returns void
language plpgsql
security definer
as $$
begin
  if p_col = 'hearts' then
    update feed_posts set hearts = greatest(0, hearts - 1) where id = p_post_id;
  elsif p_col = 'fires' then
    update feed_posts set fires = greatest(0, fires - 1) where id = p_post_id;
  elsif p_col = 'flags' then
    update feed_posts set flags = greatest(0, flags - 1) where id = p_post_id;
  elsif p_col = 'comment_count' then
    update feed_posts set comment_count = greatest(0, comment_count - 1) where id = p_post_id;
  elsif p_col = 'share_count' then
    update feed_posts set share_count = greatest(0, share_count - 1) where id = p_post_id;
  end if;
end;
$$;

grant execute on function public.increment_feed_count(text, text) to service_role;
grant execute on function public.decrement_feed_count(text, text) to service_role;
