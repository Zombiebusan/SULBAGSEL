import { defineConfig } from '@playwright/test';
import { scryptSync } from 'node:crypto';

export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1,
  use: { baseURL: 'http://localhost:3100', browserName: 'chromium', headless: true },
  webServer: {
    command: 'npm run dev -- --port 3100', url: 'http://localhost:3100/login', reuseExistingServer: false,
    env: {
      NEXT_DIST_DIR: '.next-browser',
      SESSION_SECRET: 'local-browser-test-session-secret-32-characters',
      AUTH_USERNAME: 'Sulbagsel', DATABASE_URL: '',
      AUTH_PASSWORD_HASH: 'test-salt:'+scryptSync('browser-test-password', 'test-salt', 64).toString('hex'),
    },
  },
});
