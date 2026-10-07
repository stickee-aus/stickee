-- Responsibility Engine V1 — Foundation batch, part 1: Evidence/Citation schema.
--
-- See docs/architecture/EVIDENCE_PROVENANCE_MODEL.md for the design and
-- RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md for what shipped and why.
--
-- This is the schema every Responsibility Engine relationship (migrations
-- 019, 020) depends on: a relationship is not permitted to be treated as
-- verified in the read path unless it has at least one linked Evidence row
-- with a qualifying classification (see src/lib/responsibility-data.ts).
--
-- Reversal: `drop table if exists evidence_links; drop table if exists
-- evidence; drop function if exists public.enforce_evidence_immutable_core;
-- drop function if exists public.prevent_row_delete;` (prevent_row_delete is
-- shared with migrations 019/020 — only drop it if those are being reverted
-- in the same pass, otherwise leave it in place).

-- ── Shared trigger: no hard deletes on append-only tables ───────────────────
-- Reused by evidence (this file) and every time-ranged table in migrations
-- 019/020. History is preserved by closing a row (effective_to / a
-- superseded_by_id pointer), never by removing it — enforced here at the
-- database level so it holds even for the service-role admin client, which
-- bypasses RLS entirely (see src/lib/supabase-admin.ts).
create or replace function public.prevent_row_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Rows in % cannot be deleted — this table preserves append-only history (see docs/architecture/RESPONSIBILITY_ENGINE.md §6)', tg_table_name;
end;
$$;

-- ── evidence ─────────────────────────────────────────────────────────────
-- One row per citation. Reuses the Charter's existing 8-way truth
-- classification (docs/philosophy/STICKEE_CHARTER.md §5) rather than a new
-- taxonomy. No numeric confidence score exists or is planned — see
-- EVIDENCE_PROVENANCE_MODEL.md §6 for why that's a deliberate omission, not
-- an oversight.
create table if not exists evidence (
  id uuid primary key default gen_random_uuid(),

  source_type text not null check (source_type in (
    'official', 'secondary_reporting', 'dataset', 'stickee_editorial'
  )),
  title text not null,
  source_url text,
  publisher text,
  source_published_at date,
  retrieved_at timestamptz not null default now(),

  classification text not null check (classification in (
    'verified_fact', 'sourced_analysis', 'forecast', 'community_opinion',
    'ai_generated_interpretation', 'disputed_claim', 'demo_content',
    'unknown_no_verified_data'
  )),

  -- Workflow status, distinct from `classification` (which describes *what
  -- kind* of claim this is, not whether an editor has checked it yet).
  verification_status text not null default 'unreviewed' check (
    verification_status in ('unreviewed', 'human_reviewed')
  ),
  reviewed_by uuid references auth.users(id) on delete set null,

  notes text,
  dispute_note text,
  -- Corrections are append-only: a correction inserts a NEW evidence row and
  -- points the OLD row at it via superseded_by_id. The old row is never
  -- edited to reflect the corrected understanding — see
  -- EVIDENCE_PROVENANCE_MODEL.md §4.
  superseded_by_id uuid references evidence(id) on delete set null,

  is_test_fixture boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  constraint evidence_dispute_note_required
    check (classification <> 'disputed_claim' or dispute_note is not null),
  constraint evidence_source_url_required_unless_editorial
    check (source_type = 'stickee_editorial' or source_url is not null)
);

create index if not exists idx_evidence_classification on evidence(classification);
create index if not exists idx_evidence_is_test_fixture on evidence(is_test_fixture);
create index if not exists idx_evidence_superseded_by_id on evidence(superseded_by_id);

-- Core citation fields are immutable once written; only the review workflow
-- fields (verification_status, reviewed_by, notes) and the correction
-- pointer (superseded_by_id) may change after creation. A row that has
-- already been superseded is fully frozen — see
-- EVIDENCE_PROVENANCE_MODEL.md §4.
create or replace function public.enforce_evidence_immutable_core()
returns trigger
language plpgsql
as $$
begin
  if old.superseded_by_id is not null then
    raise exception 'Evidence (id=%) has already been superseded and cannot be modified further — insert a new Evidence row instead', old.id;
  end if;
  if new.source_url is distinct from old.source_url
     or new.title is distinct from old.title
     or new.publisher is distinct from old.publisher
     or new.source_type is distinct from old.source_type
     or new.source_published_at is distinct from old.source_published_at
     or new.classification is distinct from old.classification
     or new.retrieved_at is distinct from old.retrieved_at
     or new.created_at is distinct from old.created_at
     or new.created_by is distinct from old.created_by
     or new.is_test_fixture is distinct from old.is_test_fixture then
    raise exception 'Evidence core fields are immutable — insert a new Evidence row and set superseded_by_id on this one instead of editing the claim in place';
  end if;
  return new;
end;
$$;

create trigger trg_evidence_immutable_core
  before update on evidence
  for each row execute function public.enforce_evidence_immutable_core();

create trigger trg_evidence_no_delete
  before delete on evidence
  for each row execute function public.prevent_row_delete();

alter table evidence enable row level security;

create policy "Public read non-fixture evidence"
  on evidence for select
  using (is_test_fixture = false or public.is_app_admin());

create policy "Admins can insert evidence"
  on evidence for insert
  with check (public.is_app_admin());

create policy "Admins can update evidence"
  on evidence for update
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- ── evidence_links ───────────────────────────────────────────────────────
-- Many-to-many: one Evidence row commonly supports several relationships
-- (e.g. one machinery-of-government listing backs several portfolio→
-- department rows); one relationship can accumulate several Evidence rows
-- over time. Deliberately polymorphic (subject_type/subject_id) rather than
-- one join table per relationship type — unlike the canonical person-id
-- mapping (CANONICAL_ID_STRATEGY.md §4), a wrong evidence link risks a
-- citation pointing at a slightly wrong record, not an identity
-- conflation, so the stronger per-type FK integrity used there isn't
-- warranted here. subject_id is intentionally not FK-constrained — see
-- RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md §3 for that trade-off.
create table if not exists evidence_links (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references evidence(id) on delete cascade,
  subject_type text not null check (subject_type in (
    'portfolio', 'department', 'department_portfolio',
    'person_portfolio_role', 'issue_portfolio'
  )),
  subject_id uuid not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (evidence_id, subject_type, subject_id)
);

create index if not exists idx_evidence_links_subject on evidence_links(subject_type, subject_id);
create index if not exists idx_evidence_links_evidence on evidence_links(evidence_id);

alter table evidence_links enable row level security;

create policy "Public read non-fixture evidence links"
  on evidence_links for select
  using (
    public.is_app_admin()
    or exists (
      select 1 from evidence e
      where e.id = evidence_links.evidence_id and e.is_test_fixture = false
    )
  );

create policy "Admins can insert evidence links"
  on evidence_links for insert
  with check (public.is_app_admin());

-- Evidence *links* (unlike the facts they connect) may be deleted by an
-- admin to correct a mis-linked citation — the underlying Evidence row and
-- the relationship it was linked to are both still append-only; only the
-- connection between them is correctable. See
-- RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md §3.
create policy "Admins can delete evidence links"
  on evidence_links for delete
  using (public.is_app_admin());
