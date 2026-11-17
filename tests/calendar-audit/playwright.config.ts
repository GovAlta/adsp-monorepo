import { defineConfig } from '@playwright/test';

import { existsSync } from 'fs';
import { join } from 'path';

// Local, gitignored credentials (see .env in this folder).
const envFile = join(__dirname, '.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

// API-level verification of calendar service audit integration (OSP-823). No browser is needed.
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [['list']],
});
