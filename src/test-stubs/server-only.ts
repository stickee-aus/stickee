// Test-only stand-in for the `server-only` package.
//
// `server-only` isn't a real npm dependency of this project (see
// package.json) — Next.js resolves it internally as part of its own build
// tooling, aliasing it to a no-op for server bundles and to a throwing stub
// for client bundles. Outside Next's bundler (i.e. under plain Vite/vitest),
// `import 'server-only'` fails to resolve at all, which would make every
// file that imports it (responsibility-db.ts, admin-auth.ts, etc.)
// untestable. vitest.config.ts aliases the bare specifier `server-only` to
// this empty module so those files can be imported directly in tests — this
// changes nothing about their real behaviour under Next.js, which still
// resolves the genuine package on its own terms.
export {}
