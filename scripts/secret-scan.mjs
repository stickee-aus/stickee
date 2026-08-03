#!/usr/bin/env node
// Lightweight, dependency-free secret scanner.
//
// Scans every file Git currently tracks (plus anything staged) for patterns that
// look like committed credentials. This intentionally does not call any external
// service and does not print matched values — only file path + line number + which
// pattern matched, so a real secret is never echoed to CI logs.
//
// Usage: node scripts/secret-scan.mjs

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const PATTERNS = [
  { name: 'Stripe secret/live key', re: /\b(sk|rk)_(live|test)_[A-Za-z0-9]{16,}\b/ },
  { name: 'Stripe webhook secret', re: /\bwhsec_[A-Za-z0-9]{16,}\b/ },
  { name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Generic long hex token (32+ chars)', re: /\b[0-9a-f]{32,}\b/i },
  { name: 'Supabase/JWT-looking service key', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: 'Generic "SECRET=" / "KEY=" assignment with a real-looking value', re: /\b(?:[A-Z0-9_]*(?:SECRET|API_KEY|TOKEN|PASSWORD)[A-Z0-9_]*)\s*[:=]\s*['"]?[A-Za-z0-9+/_-]{20,}['"]?/ },
]

// Files that legitimately talk *about* secrets (variable names only) and would
// otherwise false-positive on the assignment pattern above.
const ALLOWLIST = new Set([
  'scripts/secret-scan.mjs',
  '.env.example',
  'MVP_LAUNCH.example.md',
])

function trackedFiles() {
  const out = execSync('git ls-files -z', { maxBuffer: 1024 * 1024 * 64 })
    .toString('utf8')
  return out.split('\0').filter(Boolean)
}

function isBinary(buf) {
  return buf.subarray(0, 8000).includes(0)
}

function scanFile(path) {
  let buf
  try {
    buf = readFileSync(path)
  } catch {
    return []
  }
  if (isBinary(buf)) return []

  const text = buf.toString('utf8')
  const lines = text.split('\n')
  const hits = []

  for (const { name, re } of PATTERNS) {
    lines.forEach((line, idx) => {
      if (re.test(line)) {
        hits.push({ path, line: idx + 1, pattern: name })
      }
    })
  }
  return hits
}

function main() {
  const files = trackedFiles().filter(f => !ALLOWLIST.has(f))
  const allHits = files.flatMap(scanFile)

  if (allHits.length === 0) {
    console.log('secret-scan: no suspicious patterns found in tracked files.')
    process.exit(0)
  }

  console.error(`secret-scan: ${allHits.length} suspicious pattern(s) found (values not printed):`)
  for (const hit of allHits) {
    console.error(`  ${hit.path}:${hit.line} — matched "${hit.pattern}"`)
  }
  console.error('\nIf any of these are real secrets, rotate them and remove them from the tracked file.')
  console.error('If this is a false positive, add the file to ALLOWLIST in scripts/secret-scan.mjs with a comment explaining why.')
  process.exit(1)
}

main()
