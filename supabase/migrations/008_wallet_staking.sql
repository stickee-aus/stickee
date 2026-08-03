create or replace function public.place_wallet_stake(
  p_market_id text,
  p_market_question text,
  p_category text,
  p_direction text,
  p_amount integer,
  p_price integer
)
returns table (
  position_id uuid,
  new_balance integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_new_balance integer;
  v_position_id uuid;
  v_shares numeric(10,1);
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_direction not in ('yes', 'no') then
    raise exception 'Invalid direction';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_price is null or p_price <= 0 or p_price > 100 then
    raise exception 'Price must be between 1 and 100';
  end if;

  insert into user_wallets (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  update user_wallets
  set
    balance = balance - p_amount,
    total_staked = total_staked + p_amount,
    updated_at = now()
  where user_id = v_user_id
    and balance >= p_amount
  returning balance into v_new_balance;

  if v_new_balance is null then
    raise exception 'Insufficient balance';
  end if;

  v_shares := round(((p_amount::numeric / p_price::numeric) * 100) * 10) / 10;

  insert into wallet_positions (
    user_id,
    market_id,
    market_question,
    category,
    direction,
    amount,
    price,
    shares
  ) values (
    v_user_id,
    p_market_id,
    p_market_question,
    p_category,
    p_direction,
    p_amount,
    p_price,
    v_shares
  )
  returning id into v_position_id;

  return query select v_position_id, v_new_balance;
end;
$$;

grant execute on function public.place_wallet_stake(text, text, text, text, integer, integer) to authenticated;

do $$
begin
  alter publication supabase_realtime add table user_wallets;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table wallet_positions;
exception
  when duplicate_object then null;
end
$$;
