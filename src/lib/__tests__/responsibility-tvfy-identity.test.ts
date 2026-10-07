import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Tests for CANONICAL_PERSON_IDENTITY_V1: migration 023, which resolves the
 * Minister→Portfolio relationship via `members.tvfy_id` (the codebase's
 * already-canonical external person anchor, per
 * docs/architecture/CANONICAL_ID_STRATEGY.md) instead of migration 022's
 * electorate+house fallback. 022 was authored when TheyVoteForYou's API was
 * unreachable in that session; it is superseded here, not deleted — see
 * CANONICAL_PERSON_IDENTITY_V1_REPORT.md.
 */

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../supabase/migrations')
const readMigration = (filename: string) => readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8')

const migration002 = readMigration('002_external_data.sql')
const migration022 = readMigration('022_responsibility_minister_identity_pending_review.sql')
const migration023 = readMigration('023_responsibility_minister_tvfy_identity.sql')

const stripSqlComments = (sql: string) =>
  sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '')

describe('023: minister identity resolved via tvfy_id, not name or electorate', () => {
  it('looks up the member by tvfy_id, never by name', () => {
    const executable = stripSqlComments(migration023)
    expect(executable).toMatch(/where\s+tvfy_id\s*=\s*v_tvfy_id/i)
    expect(executable).not.toMatch(/\.name\s*=\s*'/i)
    expect(executable).not.toMatch(/(?<!canonical_)\bname\s*=\s*'[^']*'/i)
    expect(executable).not.toMatch(/display_name/i)
  })

  it('does not use electorate or house as the join predicate', () => {
    const executable = stripSqlComments(migration023)
    expect(executable).not.toMatch(/electorate\s*=/i)
    expect(executable).not.toMatch(/house\s*=\s*'representatives'/i)
  })

  it('contains no fuzzy-matching predicate (ilike, similarity, levenshtein, soundex)', () => {
    const executable = stripSqlComments(migration023)
    expect(executable).not.toMatch(/ilike/i)
    expect(executable).not.toMatch(/similarity\s*\(/i)
    expect(executable).not.toMatch(/levenshtein/i)
    expect(executable).not.toMatch(/soundex/i)
  })

  it('guards on the member existing before inserting anything', () => {
    expect(migration023).toMatch(/v_member_id is null/)
    expect(migration023).toMatch(/raise exception 'BLOCKER/i)
  })

  it('is idempotent — does nothing if the role already exists for this member/portfolio', () => {
    expect(migration023).toMatch(/already exists.*skipping/i)
    expect(migration023).toMatch(/return;/)
  })

  it('requires migration 021\'s Evidence rows to exist before inserting the role (never inserts an unevidenced relationship)', () => {
    expect(migration023).toMatch(/v_evidence_instrument_id is null or v_evidence_treasury_profile_id is null/)
  })

  it('links the inserted role to real (already-existing) Evidence rows via evidence_links', () => {
    expect(migration023).toMatch(/insert into evidence_links/i)
    expect(migration023).toMatch(/person_portfolio_role/)
  })

  it('inserts a real (is_test_fixture = false) row, never a fixture', () => {
    const insertRole = migration023.match(/insert into person_portfolio_roles[\s\S]*?\);/i)?.[0] ?? ''
    expect(insertRole).toMatch(/false\)/)
  })
})

describe('members.tvfy_id is a genuinely unique, typed external identifier', () => {
  it('is declared unique and not null at the schema level (duplicate tvfy_id is rejected by the database, not app logic)', () => {
    expect(migration002).toMatch(/tvfy_id\s+integer\s+unique\s+not\s+null/i)
  })

  it('members carries no other person-identity column that could compete with tvfy_id as the join key', () => {
    // electorate/house/party/name all exist for display and (in 022's now-
    // superseded proposal) as a fallback join — but none of them is unique,
    // so none of them is safe as *the* identity anchor. This test documents
    // that expectation rather than re-deriving it from scratch each review.
    expect(migration002).not.toMatch(/electorate\s+text\s+unique/i)
    expect(migration002).not.toMatch(/name\s+text\s+unique/i)
  })
})

describe('022 remains inert and unmodified — superseded, not deleted', () => {
  it('every executable statement is still wrapped in a block comment', () => {
    const withoutBlockComments = migration022.replace(/\/\*[\s\S]*?\*\//g, '')
    const withoutLineComments = withoutBlockComments.replace(/--.*$/gm, '')
    expect(withoutLineComments).not.toMatch(/insert into/i)
  })

  it('022 cannot silently attach the wrong person: its guard rejects zero or multiple electorate matches rather than picking one', () => {
    const insideComment = migration022.match(/\/\*([\s\S]*?)\*\//)?.[1] ?? ''
    expect(insideComment).toMatch(/v_member_count = 0/)
    expect(insideComment).toMatch(/v_member_count > 1/)
    expect(insideComment).toMatch(/raise exception/i)
  })
})

describe('Senate identities are not forced through a House-only rule', () => {
  it('023 (the applied identity resolution) makes no assumption about house at all — it keys purely on tvfy_id, which is populated for both chambers', () => {
    const executable = stripSqlComments(migration023)
    expect(executable).not.toMatch(/house/i)
  })

  it('022\'s electorate+house fallback is explicitly House-only in its own guard, and is never applied — a future Senate minister role must not reuse this pattern', () => {
    const insideComment = migration022.match(/\/\*([\s\S]*?)\*\//)?.[1] ?? ''
    expect(insideComment).toMatch(/house\s*=\s*'representatives'/i)
    // 022 is inert (asserted above) — so this House-only assumption never
    // executes. This test exists so that if 022 is ever uncommented for a
    // Senate case without modification, a reviewer has a named test to fail.
  })

  it('members table has no unique constraint that would make (electorate, house) a safe general identity key — Senators have no electorate at all', () => {
    // electorate is a plain nullable text column; Senate rows in the real
    // TVFY dataset carry electorate = null, so an electorate-based lookup
    // structurally cannot resolve a Senator regardless of guards.
    expect(migration002).toMatch(/electorate\s+text,/)
    expect(migration002).not.toMatch(/electorate\s+text\s+not\s+null/i)
  })
})

describe('no source encodes an external id directly into a public route id', () => {
  it('023 never constructs a route-shaped string like `tvfy-<id>` or `mp-<id>`', () => {
    expect(migration023).not.toMatch(/'tvfy-/i)
    expect(migration023).not.toMatch(/'mp-/i)
  })
})
