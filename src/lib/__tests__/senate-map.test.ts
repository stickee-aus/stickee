import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { SENATE_STATES, TOTAL_SENATE_SEATS, STATE_SHAPES } from '@/lib/au-senate-states'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Regression tests for GOVERNMENT_V1_MAP_REPORT.md — replacing the Senate's
// horizontal party bar with an interactive Australia map, governed by
// docs/philosophy/STICKEE_CHARTER.md.

describe('au-senate-states.ts — real, constitutional reference data', () => {
  it('includes all 6 states and both territories, ACT included', () => {
    const ids = SENATE_STATES.map(s => s.id)
    expect(ids).toContain('WA')
    expect(ids).toContain('NT')
    expect(ids).toContain('SA')
    expect(ids).toContain('QLD')
    expect(ids).toContain('NSW')
    expect(ids).toContain('VIC')
    expect(ids).toContain('TAS')
    expect(ids).toContain('ACT')
    expect(ids).toHaveLength(8)
  })

  it('gives each state 12 senators and each territory 2, totalling 76', () => {
    const states = SENATE_STATES.filter(s => !s.isTerritory)
    const territories = SENATE_STATES.filter(s => s.isTerritory)
    expect(states).toHaveLength(6)
    expect(territories).toHaveLength(2)
    expect(states.every(s => s.senatorCount === 12)).toBe(true)
    expect(territories.every(s => s.senatorCount === 2)).toBe(true)
    expect(TOTAL_SENATE_SEATS).toBe(76)
  })

  it('has a map shape for every state except ACT (too small for a filled hit target)', () => {
    const shapeIds = Object.keys(STATE_SHAPES)
    expect(shapeIds).toHaveLength(7)
    expect(shapeIds).not.toContain('ACT')
  })
})

describe('AustraliaSenateMap — map is the primary Senate interaction', () => {
  const source = read('src/components/AustraliaSenateMap.tsx')

  it('renders all 7 mapped states plus a distinct ACT marker', () => {
    expect(source).toContain('STATE_SHAPES')
    expect(source).toContain('ACT_MARKER')
    expect(source).toContain("SENATE_STATE_INDEX.ACT")
  })

  it('gives ACT its own visible, focusable interaction despite being a callout', () => {
    expect(source).toMatch(/role="button"[\s\S]*?ACT/)
    expect(source).toContain('tabIndex={0}')
  })

  it('has the exact required education copy, and nothing longer', () => {
    expect(source).toContain('The Senate gives every Australian state equal representation regardless of population.')
    expect(source).toContain('Hover over a state to see who represents it.')
  })

  it('synchronizes hover between map and sidebar via one shared state value', () => {
    expect(source).toContain('hoveredState')
    expect(source).toContain('activeState')
  })

  it('supports keyboard activation (Enter/Space) equivalent to click', () => {
    expect(source).toContain("e.key === 'Enter'")
    expect(source).toContain("e.key === ' '")
  })

  it('every region and sidebar row has a descriptive ARIA label, not colour-only', () => {
    expect(source).toContain('aria-label={`${info.name}, ${info.senatorCount} senators`}')
  })

  it('does not render party colours or vote colours on the map regions themselves', () => {
    expect(source).not.toContain('PARTY_COLORS[')
    expect(source).not.toContain('SENATE_PARTY_COLORS[')
  })

  it('clicking/activating a state does not open a modal', () => {
    expect(source).not.toContain('Dialog')
    expect(source).not.toContain('<Modal')
  })
})

describe('SenateStateDetailPanel — state-only content, never national', () => {
  const source = read('src/components/SenateStateDetailPanel.tsx')

  it('never renders national party composition inside the state panel', () => {
    expect(source).not.toContain('SENATE_SEAT_COUNTS')
    expect(source).not.toContain('countsByParty')
  })

  it('shows the real constitutional senator count and explanatory sentence', () => {
    expect(source).toContain('state.senatorCount')
    expect(source).toContain('is represented by')
  })

  it('shows the exact truthful unavailable notice for individual senator records', () => {
    expect(source).toContain('does not yet have a verified senator-to-state dataset')
    expect(source).toContain('not available here yet')
  })

  it('does not invent or infer a list of senators', () => {
    expect(source).not.toContain('senators.map')
    expect(source).not.toContain('.keyMPs')
  })

  it('labels live election data as an election count, never as "current votes"', () => {
    expect(source).toContain('Live Senate election count')
    expect(source).not.toContain('Current votes')
    expect(source).not.toContain('Current Senate votes')
  })

  it('only shows the live election section when genuinely active — no fallback placeholder line for it', () => {
    expect(source).toContain('liveElectionState &&')
  })
})

describe('SenateView — fabricated result removed, national composition separated', () => {
  const source = read('src/components/SenateView.tsx')

  it('no longer renders the fabricated Senate bill-vote numbers', () => {
    // Only a code comment explains the historical removal (mentions the
    // name); check there's no live import, matching the pattern already
    // established in people-v1-simplification.test.ts.
    expect(source).not.toMatch(/^import.*senateBillVoteRows/m)
    expect(source).not.toContain('totalFor')
    expect(source).not.toContain('totalAgainst')
    expect(source).not.toContain('Passes (')
    expect(source).not.toContain('Fails (')
  })

  it('shows the exact required truthful notice when a bill is selected', () => {
    expect(source).toContain('No verified Senate division data is available for this item.')
  })

  it('removed the old horizontal seat-composition bar and 3-column group breakdown', () => {
    expect(source).not.toContain('SeatCompositionBar')
    expect(source).not.toContain('GroupColumn')
    expect(source).not.toContain('PartyRow')
    expect(source).not.toContain("GROUPS = [")
  })

  it('removed the now-purposeless Votes/Parties tab toggle', () => {
    expect(source).not.toContain('showPartyColors')
  })

  it('renders the map as the primary view', () => {
    expect(source).toContain('AustraliaSenateMap')
  })

  it('national composition is a clearly separate, explicitly national section', () => {
    expect(source).toContain('Senate composition — nationally')
    expect(source).toContain("not any individual state")
  })

  it('keeps the header senator count and majority, real and unchanged in source', () => {
    expect(source).toContain('SENATE_MAJORITY')
    expect(source).toContain('senators ·')
  })
})

describe('senateBillVoteRows — confirmed orphaned, not deleted', () => {
  it('mock-senate-data.ts still exports it (left in place per repo convention)', () => {
    const source = read('src/lib/mock-senate-data.ts')
    expect(source).toContain('export const senateBillVoteRows')
  })

  it('no live component other than its own definition file imports it anymore', () => {
    const senateView = read('src/components/SenateView.tsx')
    const map = read('src/components/AustraliaSenateMap.tsx')
    const panel = read('src/components/SenateStateDetailPanel.tsx')
    expect(senateView).not.toMatch(/^import.*senateBillVoteRows/m)
    expect(map).not.toContain('senateBillVoteRows')
    expect(panel).not.toContain('senateBillVoteRows')
  })
})
