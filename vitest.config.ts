import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // See src/test-stubs/server-only.ts — 'server-only' is resolved by
      // Next.js's own bundler, not a real dependency, so plain vitest needs
      // this alias to import any file that carries the `server-only` marker.
      'server-only': path.resolve(__dirname, './src/test-stubs/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
})
