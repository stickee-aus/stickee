-- Responsibility Engine V1 — Foundation batch, part 3: time-ranged
-- Person↔Portfolio roles, and Issue↔Portfolio relationships.
--
-- See docs/architecture/RESPONSIBILITY_ENGINE.md §1–§4 and
-- RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md for the full design and
-- what shipped. Depends on migrations 018 (evidence) and 019 (portfolios,
-- departments, enforce_history_append_only()).
--
-- Person identity: person_portfolio_roles.member_id references the
-- existing `members` table (migration 002) directly — members.id is
-- already a real, stable, database-issued uuid for every synced sitting
-- parliamentarian. This batch deliberately does NOT introduce a new
-- canonical `people` table or `person_external_ids` mapping
-- (docs/architecture/CANONICAL_ID_STRATEGY.md §3–§5): every Australian
-- Minister must be a sitting MP or Senator, so members.id is sufficient
-- identity for V1's scope. See
-- RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md §6 for the reasoning and
-- its one known limitation (a Minister who leaves Parliament is out of
-- scope until the broader person-identity migration happens).
--
-- No mp-*/house-live-*/tvfy-* string ids are used or reconciled anywhere in
-- this file — every reference here is a real Postgres foreign key.
--
-- Reversal: `drop table if exists issue_portfolios; drop table if exists
-- person_portfolio_roles;`

-- ── person_portfolio_roles ───────────────────────────────────────────────
-- Person → role → Portfolio, time-ranged. Distinguishes role_type (Minister
-- vs Assistant Minister) as separate values, never a boolean is_minister —
-- see RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md §5. Shadow Minister is
-- deliberately NOT included: it is not part of the approved model in
-- docs/architecture/RESPONSIBILITY_ENGINE.md (which only ever discusses
-- Portfolio→Person in terms of who holds government office), and modelling
-- opposition/shadow roles would require a party-structure concept this
-- batch does not build. responsibility_kind is carried per-row from the
-- full seven-kind taxonomy (RESPONSIBILITY_ENGINE.md §1) rather than a
-- fixed constant, so future role types (e.g. committee chairs, once
-- Committee exists) can reuse this table without a schema change — but V1
-- only ever inserts 'responsibility' (see
-- RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md §7 for which of the seven
-- kinds this batch actually uses).
create table if not exists person_portfolio_roles (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  role_type text not null check (role_type in ('minister', 'assistant_minister')),
  responsibility_kind text not null default 'responsibility' check (responsibility_kind in (
    'authority', 'responsibility', 'implementation', 'oversight',
    'scrutiny', 'influence', 'representation'
  )),
  effective_from date not null,
  effective_to date,
  is_test_fixture boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

-- Prevents the exact same (member, portfolio, role_type) triple being
-- active twice — does not limit a member to one portfolio (a Minister can
-- hold more than one concurrently) or a portfolio to one titleholder-type
-- (a Minister and an Assistant Minister can both be active on the same
-- portfolio at once).
create unique index if not exists uq_person_portfolio_roles_active
  on person_portfolio_roles(member_id, portfolio_id, role_type) where effective_to is null;
create index if not exists idx_person_portfolio_roles_member
  on person_portfolio_roles(member_id) where effective_to is null;
create index if not exists idx_person_portfolio_roles_portfolio
  on person_portfolio_roles(portfolio_id) where effective_to is null;

create trigger trg_person_portfolio_roles_append_only
  before update on person_portfolio_roles
  for each row execute function public.enforce_history_append_only();

create trigger trg_person_portfolio_roles_no_delete
  before delete on person_portfolio_roles
  for each row execute function public.prevent_row_delete();

alter table person_portfolio_roles enable row level security;

create policy "Public read non-fixture person_portfolio_roles"
  on person_portfolio_roles for select
  using (is_test_fixture = false or public.is_app_admin());

create policy "Admins can insert person_portfolio_roles"
  on person_portfolio_roles for insert
  with check (public.is_app_admin());

create policy "Admins can update person_portfolio_roles"
  on person_portfolio_roles for update
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- ── issue_portfolios ─────────────────────────────────────────────────────
-- Issue ↔ Portfolio, many-to-many, time-ranged. Deliberately a join table,
-- NOT a `portfolio_id` column on `issues` — see
-- RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md §5 for why a bare column
-- would recreate the same "column exists, nothing keeps it current" defect
-- already found and fixed once on issues.mp_yes_count. One issue can carry
-- several concurrent portfolio relationships (of different
-- responsibility_kind, or the same kind from different levels of
-- government); one portfolio can be linked from many issues.
create table if not exists issue_portfolios (
  id uuid primary key default gen_random_uuid(),
  issue_id text not null references issues(id) on delete cascade,
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  responsibility_kind text not null check (responsibility_kind in (
    'authority', 'responsibility', 'implementation', 'oversight',
    'scrutiny', 'influence', 'representation'
  )),
  effective_from date not null default current_date,
  effective_to date,
  is_test_fixture boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create unique index if not exists uq_issue_portfolios_active
  on issue_portfolios(issue_id, portfolio_id, responsibility_kind) where effective_to is null;
create index if not exists idx_issue_portfolios_portfolio
  on issue_portfolios(portfolio_id) where effective_to is null;
create index if not exists idx_issue_portfolios_issue
  on issue_portfolios(issue_id) where effective_to is null;

create trigger trg_issue_portfolios_append_only
  before update on issue_portfolios
  for each row execute function public.enforce_history_append_only();

create trigger trg_issue_portfolios_no_delete
  before delete on issue_portfolios
  for each row execute function public.prevent_row_delete();

alter table issue_portfolios enable row level security;

create policy "Public read non-fixture issue_portfolios"
  on issue_portfolios for select
  using (is_test_fixture = false or public.is_app_admin());

create policy "Admins can insert issue_portfolios"
  on issue_portfolios for insert
  with check (public.is_app_admin());

create policy "Admins can update issue_portfolios"
  on issue_portfolios for update
  using (public.is_app_admin())
  with check (public.is_app_admin());
