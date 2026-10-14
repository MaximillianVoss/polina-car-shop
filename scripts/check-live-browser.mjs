import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const requests = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('https://car-rest-service-carshop.2.rahtiapp.fi/**', async route => {
    requests.push({ method: route.request().method(), url: route.request().url() });
    if (route.request().method() !== 'GET') throw new Error('Read-only check forbids remote mutations');
    await route.continue();
  });
  await page.goto('http://127.0.0.1:4176/');
  await page.locator('tbody tr').first().waitFor({ timeout: 30000 });
  const count = await page.locator('tbody tr').count();
  await page.getByLabel('Search cars').fill('volvo');
  const filteredCount = await page.locator('tbody tr').count();
  if (!filteredCount || filteredCount > count || errors.length) throw new Error(`Live UI failure: ${JSON.stringify({ count, filteredCount, errors })}`);
  await page.screenshot({ path: 'evidence/live-browser.png', fullPage: true });
  const evidence = { checkedAt: new Date().toISOString(), mode: 'read-only', count, filteredCount, requests, errors, remoteMutationsTested: false };
  await writeFile('evidence/live-browser.json', JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence));
} finally { await browser.close(); }
