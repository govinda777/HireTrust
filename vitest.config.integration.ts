import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.spec.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@hiretrust/database': path.resolve(__dirname, './packages/database/src/index.ts'),
      '@hiretrust/shared': path.resolve(__dirname, './packages/shared/src/index.ts'),
    }
  }
})
