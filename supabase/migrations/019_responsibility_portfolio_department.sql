-- Responsibility Engine V1 — Foundation batch, part 2: Portfolio and
-- Department canonical entities.
--
-- See docs/architecture/RESPONSIBILITY_ENGINE.md §2 and
-- RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md for the design and what
-- shipped. Depends on migration 018 (evidence, prevent_row_delete()).
--
-- No current Cabinet list or department roster is seeded here — see
-- RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md §10 for why (no
-- machine-readable authoritative source was identified; real rows require
-- an editor-entered, evidence-linked record, not a bulk import).
--
-- Reversal: `drop table if exists department_portfolios; drop table if
-- exists departments; drop table if exists portfolios; drop function if
-- exists public.enforce_history_append_only;` (only drop the function if
-- migration 020 is being reverted in the same pass — it's shared).

-- ── Shared trigger: append-only history for time-ranged tables ─────────────
-- A time-ranged row may only ever be updated once: to set effective_to
-- (closing it). Every other field is frozen from the moment it's inserted,
-- and a row that's already closed (effective_to is not null) can never be
-- updated again. A reshuffle/rename/reassignment always inserts a new row
-- rather than editing the old one — see RESPONSIBILITY_ENGINE.md §6. This
-- is enforced generically via to_jsonb() row comparison so one function
-- covers every time-ranged table added in this batch.
create or replace function public.enforce_history_append_only()
returns trigger
language plpgsql
as $$
begin
  if old.effective_to is not null then
    raise exception 'Historical row (id=%) in % is already closed and cannot be modified — insert a new row instead of editing history', old.id, tg_table_name;
  end if;
  if new.effective_to is null then
    raise exception 'Updates to an open historical row in % must set effective_to to close it — in-place edits are not permitted, insert a new row instead', tg_table_name;
  end if;
  if (to_jsonb(old) - 'effective_to') <> (to_jsonb(new) - 'effective_to') then
    raise exception 'Only effective_to may change when closing a historical row in % — insert a new row for any other change', tg_table_name;
  end if;
  return new;
end;
$$;

-- ── portfolios ───────────────────────────────────────────────────────────
create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  jurisdiction text not null check (jurisdiction in (
    'commonwealth', 'nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt', 'local'
  )),
  effective_from date not null,
  effective_to date,
  is_test_fixture boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

-- Partial index: fast "what's the current portfolio set" queries without
-- scanning closed history.
create index if not exists idx_portfolios_current
  on portfolios(jurisdiction) where effective_to is null;
create index if not exists idx_portfolios_is_test_fixture on portfolios(is_test_fixture);

create trigger trg_portfolios_append_only
  before update on portfolios
  for each row execute function public.enforce_history_append_only();

create trigger trg_portfolios_no_delete
  before delete on portfolios
  for each row execute function public.prevent_row_delete();

alter table portfolios enable row level security;

create policy "Public read non-fixture portfolios"
  on portfolios for select
  using (is_test_fixture = false or public.is_app_admin());

create policy "Admins can insert portfolios"
  on portfolios for insert
  with check (public.is_app_admin());

create policy "Admins can update portfolios"
  on portfolios for update
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- ── departments ──────────────────────────────────────────────────────────
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  jurisdiction text not null check (jurisdiction in (
    'commonwealth', 'nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt', 'local'
  )),
  effective_from date not null,
  effective_to date,
  is_test_fixture boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create index if not exists idx_departments_current
  on departments(jurisdiction) where effective_to is null;
create index if not exists idx_departments_is_test_fixture on departments(is_test_fixture);

create trigger trg_departments_append_only
  before update on departments
  for each row execute function public.enforce_history_append_only();

create trigger trg_departments_no_delete
  before delete on departments
  for each row execute function public.prevent_row_delete();

alter table departments enable row level security;

create policy "Public read non-fixture departments"
  on departments for select
  using (is_test_fixture = false or public.is_app_admin());

create policy "Admins can insert departments"
  on departments for insert
  with check (public.is_app_admin());

create policy "Admins can update departments"
  on departments for update
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- ── department_portfolios ────────────────────────────────────────────────
-- Many-to-many, time-ranged: a department is not assumed to sit under
-- exactly one portfolio forever (see RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md
-- §5) — a department can concurrently support more than one portfolio, and
-- reorganisations move a department between portfolios over time.
create table if not exists department_portfolios (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  effective_from date not null,
  effective_to date,
  is_test_fixture boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

-- Prevents inserting the exact same (department, portfolio) pair twice
-- while both are active — does not limit how many *distinct* portfolios a
-- department can concurrently sit under, or vice versa.
create unique index if not exists uq_department_portfolios_active
  on department_portfolios(department_id, portfolio_id) where effective_to is null;
create index if not exists idx_department_portfolios_portfolio
  on department_portfolios(portfolio_id) where effective_to is null;
create index if not exists idx_department_portfolios_department
  on department_portfolios(department_id) where effective_to is null;

create trigger trg_department_portfolios_append_only
  before update on department_portfolios
  for each row execute function public.enforce_history_append_only();

create trigger trg_department_portfolios_no_delete
  before delete on department_portfolios
  for each row execute function public.prevent_row_delete();

alter table department_portfolios enable row level security;

create policy "Public read non-fixture department_portfolios"
  on department_portfolios for select
  using (is_test_fixture = false or public.is_app_admin());

create policy "Admins can insert department_portfolios"
  on department_portfolios for insert
  with check (public.is_app_admin());

create policy "Admins can update department_portfolios"
  on department_portfolios for update
  using (public.is_app_admin())
  with check (public.is_app_admin());
