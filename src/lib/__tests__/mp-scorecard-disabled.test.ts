import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { mpScorecard } from '@/lib/agents/mp-scorecard'
import type { AgentContext } from '@/lib/agents/runner'

/**
 * Regression coverage for the Responsibility Engine V1 Phase 0 fix (see
 * RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md §1). The original agent
 * matched real MPs to human user accounts by `user_profiles.display_name`
 * string equality — a real correctness/privacy defect, since display_name
 * is user-editable. These tests prove that join is gone and was not
 * replaced with another name/fuzzy-matching heuristic.
 */

function createMockContext(): AgentContext & { calledTables: string[] } {
  const calledTables: string[] = []

  const from = (table: string) => {
    calledTables.push(table)
    // A minimal chainable stub — every method returns `this` so any call
    // shape the old implementation used still resolves, and we can assert
    // on `calledTables` regardless of which methods would have been chained.
    const chain: Record<string, unknown> = {}
    const self = new Proxy(chain, {
      get(_target, prop) {
        if (prop === 'then') return undefined // not a thenable
        return (..._args: unknown[]) => self
      },
    })
    return self
  }

  return {
    admin: { from } as unknown as AgentContext['admin'],
    config: {},
    processed: 0,
    written: 0,
    notes: [],
    calledTables,
  }
}

describe('mp-scorecard: name-based account association removed', () => {
  it('never queries user_profiles (the table it used to name-match against)', async () => {
    const ctx = createMockContext()
    await mpScorecard(ctx)
    expect(ctx.calledTables).not.toContain('user_profiles')
  })

  it('touches no Supabase table at all — it is a full no-op', async () => {
    const ctx = createMockContext()
    await mpScorecard(ctx)
    expect(ctx.calledTables).toEqual([])
  })

  it('reports a non-"ok" status so the no-op is visible in agent_runs, not silently green', async () => {
    const ctx = createMockContext()
    const result = await mpScorecard(ctx)
    expect(result?.status).toBe('warn')
    expect(result?.summary?.toLowerCase()).toContain('disabled')
  })

  it('writes nothing (ctx.written stays 0)', async () => {
    const ctx = createMockContext()
    await mpScorecard(ctx)
    expect(ctx.written).toBe(0)
  })

  it('leaves a note explaining why, for anyone reading agent_runs later', async () => {
    const ctx = createMockContext()
    await mpScorecard(ctx)
    expect(ctx.notes.join(' ')).toMatch(/no canonical person.{0,5}user-account relationship/i)
  })

  /**
   * Strips `/* ... *\/` and `// ...` comments before scanning, so the
   * explanatory docstring (which *names* the removed pattern, e.g. "fuzzy
   * name match", as prose) can't produce a false positive — these
   * assertions are about executable code, not about whether the word
   * appears anywhere in the file.
   */
  function stripComments(source: string): string {
    return source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
  }

  it('source contains no display_name equality/name-matching query pattern', () => {
    const source = stripComments(
      readFileSync(path.resolve(__dirname, '../agents/mp-scorecard.ts'), 'utf8'),
    )
    // Runtime strings are allowed to *mention* display_name/user_profiles
    // (the disabled-agent summary explains what was removed, by name, for
    // anyone reading agent_runs later) — what must never reappear is the
    // actual dangerous *call pattern*: a query filtering/joining on either.
    expect(source).not.toMatch(/\.eq\(\s*['"]display_name['"]/i)
    expect(source).not.toMatch(/\.ilike\(\s*['"]display_name['"]/i)
    expect(source).not.toMatch(/\.eq\(\s*['"]name['"]/i)
    expect(source).not.toMatch(/\.ilike\(/i)
    expect(source).not.toMatch(/from\(\s*['"]user_profiles['"]\s*\)/i)
  })

  it('source contains no fuzzy/string person-reconciliation helper', () => {
    const source = stripComments(
      readFileSync(path.resolve(__dirname, '../agents/mp-scorecard.ts'), 'utf8'),
    )
    expect(source).not.toMatch(/toLowerCase\(\)/i)
    expect(source).not.toMatch(/levenshtein|fuzzy|similarity/i)
  })
})
