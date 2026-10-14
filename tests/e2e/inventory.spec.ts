import { test, expect, type Page } from '@playwright/test';
const local = 'http://127.0.0.1:4175/api/cars';
async function fill(page: Page) {
  for (const [name,value] of Object.entries({Brand:'Practice',Model:'Roadster',Color:'Blue',Fuel:'Electric',Year:'2024',Price:'12500.5'})) await page.getByRole('dialog').getByLabel(name, {exact:true}).fill(value);
}
test('CRUD, validation, numeric sort, search, cancel and keyboard focus on local HTTP backend', async ({page}) => {
  const remote: string[] = [], errors: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:') && !request.url().startsWith('data:')) remote.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await expect(page.getByText('2 of 2 cars')).toBeVisible();
  await page.getByLabel('Sort by').selectOption('price');
  await expect(page.locator('tbody tr').first()).toContainText('Nissan');
  await page.getByRole('button',{name:'Sort descending'}).click();
  await expect(page.locator('tbody tr').first()).toContainText('Volvo');
  await page.screenshot({path:'evidence/desktop.png',fullPage:true});
  await page.getByRole('button',{name:'+ Add car',exact:true}).click();
  await page.getByRole('button',{name:'Save car',exact:true}).click();
  await expect(page.getByText('Brand is required.')).toBeVisible();
  await fill(page); await page.getByRole('button',{name:'Save car',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.getByText('Car added.',{exact:true})).toBeVisible();
  await page.getByLabel('Search cars').fill('practice'); await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button',{name:'Edit Practice Roadster',exact:true}).click();
  await expect(page.getByRole('dialog').getByLabel('Price',{exact:true})).toHaveValue('12500.5');
  await page.getByRole('dialog').getByLabel('Model',{exact:true}).fill('Tourer');
  await page.getByRole('button',{name:'Save car',exact:true}).click();
  await expect(page.getByRole('button',{name:'Edit Practice Tourer',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Delete Practice Tourer',exact:true}).click();
  await page.getByRole('button',{name:'Cancel',exact:true}).click(); await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button',{name:'Delete Practice Tourer',exact:true}).click();
  await page.getByRole('button',{name:'Delete car',exact:true}).click();
  await expect(page.getByText('No matching cars',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Clear search',exact:true}).click();
  await page.getByRole('button',{name:'+ Add car',exact:true}).click(); await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.getByRole('button',{name:'+ Add car',exact:true})).toBeFocused();
  expect(remote).toEqual([]); expect(errors).toEqual([]);
});
test('mobile cards and dialog fit viewport; keyboard can cancel', async ({page}) => {
  await page.setViewportSize({width:390,height:844}); await page.goto('/');
  await expect(page.getByText('2 of 2 cars')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:'evidence/mobile.png',fullPage:true});
  await page.getByRole('button',{name:'+ Add car',exact:true}).click(); await fill(page);
  await page.screenshot({path:'evidence/mobile-form.png',fullPage:true});
  expect(await page.getByRole('dialog').evaluate(el => el.getBoundingClientRect().width <= innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
});
test('loading, empty list and read error with recovery', async ({page}) => {
  let mode = 'loading';
  await page.route(local, async route => {
    if (mode === 'loading') await new Promise(resolve => setTimeout(resolve,500));
    if (mode === 'error') await route.fulfill({status:500,body:'{}'});
    else await route.fulfill({contentType:'application/json',body:JSON.stringify({_embedded:{cars:[]}})});
  });
  await page.goto('/'); await expect(page.getByText('Loading inventory…')).toBeVisible();
  await expect(page.getByText('The showroom is empty',{exact:true})).toBeVisible();
  mode='error'; await page.getByRole('button',{name:'Refresh',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('500');
  mode='empty'; await page.getByRole('button',{name:'Try again',exact:true}).click(); await expect(page.getByRole('alert')).toHaveCount(0);
});
test('failed POST keeps form values; failed DELETE keeps car; busy prevents duplicate submit', async ({page}) => {
  await page.goto('/'); await expect(page.getByText('2 of 2 cars')).toBeVisible();
  let posts=0;
  await page.route(`${local}**`, async route => {
    if (route.request().method()==='POST') { posts++; await new Promise(resolve=>setTimeout(resolve,500)); await route.fulfill({status:500,body:'{}'}); }
    else if (route.request().method()==='DELETE') await route.fulfill({status:404,body:'{}'});
    else await route.continue();
  });
  await page.getByRole('button',{name:'+ Add car',exact:true}).click(); await fill(page);
  await page.getByRole('button',{name:'Save car',exact:true}).click(); await expect(page.getByRole('button',{name:'Saving…',exact:true})).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('500'); expect(posts).toBe(1);
  await expect(page.getByRole('dialog').getByLabel('Brand',{exact:true})).toHaveValue('Practice');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.getByRole('button',{name:'Delete Volvo XC60',exact:true}).click(); await page.getByRole('button',{name:'Delete car',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('404'); await expect(page.locator('tbody tr')).toHaveCount(2);
});
test('failed PUT preserves edit form and success followed by read failure is distinct', async ({page}) => {
  await page.goto('/'); await expect(page.getByText('2 of 2 cars')).toBeVisible();
  await page.route(`${local}/*`, async route => {
    if (route.request().method() === 'PUT') await route.fulfill({status:500,body:'{}'});
    else await route.continue();
  });
  await page.getByRole('button',{name:'Edit Volvo XC60',exact:true}).click();
  await page.getByRole('dialog').getByLabel('Model',{exact:true}).fill('Changed');
  await page.getByRole('button',{name:'Save car',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('500');
  await expect(page.getByRole('dialog').getByLabel('Model',{exact:true})).toHaveValue('Changed');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.unroute(`${local}/*`);
  let saved = false;
  await page.route(local, async route => {
    if (route.request().method() === 'POST') { saved=true; await route.fulfill({status:201,body:'{}'}); }
    else if (saved) await route.fulfill({status:500,body:'{}'});
    else await route.continue();
  });
  await page.getByRole('button',{name:'+ Add car',exact:true}).click(); await fill(page);
  await page.getByRole('button',{name:'Save car',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Car added.',{exact:true})).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Inventory could not be refreshed.');
});
