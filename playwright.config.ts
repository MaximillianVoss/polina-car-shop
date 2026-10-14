import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1,
  reporter: [['list'], ['json', { outputFile: 'evidence/e2e-results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4175', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: [
    { command: `"${process.execPath}" scripts/mock-server.mjs`, url: 'http://127.0.0.1:4174/cars', reuseExistingServer: false },
    { command: `"${process.execPath}" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4175 --strictPort`, url: 'http://127.0.0.1:4175', reuseExistingServer: false, env: { VITE_API_BASE_URL: 'http://127.0.0.1:4174/' } },
  ],
});
