import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

// Minimal config: this repo had no ESLint installed at all before this
// batch (see TEST_AND_VERIFICATION_REPORT.md). Next.js 16 removed `next
// lint` and the old FlatCompat-based setup in favor of importing
// eslint-config-next's flat configs directly (see
// node_modules/next/dist/docs/.../03-eslint.md) — this file follows that
// current convention rather than the older pattern.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'supabase/migrations_bundle.sql',
    '**/*.bak',
  ]),
])

export default eslintConfig
