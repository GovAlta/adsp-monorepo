import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './__tests__/setup.ts',
    exclude: ['e2e/**', 'node_modules/**'],
    // pool: 'forks' — required for vi.mock isolation across test files.
    // With pool: 'threads' (default) Vitest shares the module registry
    // across workers in the same thread, causing vi.mock in one file to
    // bleed into another file's async callbacks (observed: AuditLog TC-048
    // getByText('Export PDF') failing when suite runs in parallel).
    // forks isolates each test file in its own Node.js process.
    pool: 'forks',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
})
