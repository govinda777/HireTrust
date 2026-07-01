import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@hiretrust/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@hiretrust/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
      '@blockchain': path.resolve(__dirname, '../../packages/blockchain')
    }
  }
})
