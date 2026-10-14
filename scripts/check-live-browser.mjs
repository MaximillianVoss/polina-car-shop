import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
const pageUrl = process.env.CARSHOP_CHECK_PAGE || 'http://127.0.0.1:4176/';
const origin = new URL(pageUrl).origin;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const requests = [], errors = [], failures = [];
  page.on('request', request => {
    if (request.url().startsWith(`${origin}/api/`)) {
      requests.push({ method: request.method(), url: request.url() });
      if (request.method() !== 'GET') errors.push('Read-only check forbids mutations');
    }
  });
  page.on('requestfailed', request => failures.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('https://car-rest-service-carshop.2.rahtiapp.fi/**', async route => {
    errors.push('The local app attempted a direct browser request to the remote API.');
    await route.abort('blockedbyclient');
  });
  await page.goto(pageUrl);
  await page.locator('tbody tr').first().waitFor({ timeout: 35000 });
  const count = await page.locator('tbody tr').count();
  await page.getByLabel('Search cars').fill('volvo');
  const filteredCount = await page.locator('tbody tr').count();
  if (!filteredCount || filteredCount > count || !requests.length || errors.length || failures.length) throw new Error(`Live UI failure: ${JSON.stringify({ count, filteredCount, errors, failures })}`);
  await mkdir('evidence', { recursive: true });
  await page.screenshot({ path: 'evidence/live-browser.png', fullPage: true });
  const evidence = { checkedAt: new Date().toISOString(), mode: 'read-only through same-origin local proxy', count, filteredCount, requests, errors, failures, directBrowserApiBlocked: true, remoteMutationsTested: false };
  await writeFile('evidence/live-browser.json', JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence));
} finally { await browser.close(); }
