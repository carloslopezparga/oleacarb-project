import { test, expect, type Page } from '@playwright/test';

const norm = (s: string) => s.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();

async function kpis(page: Page) {
  await page.waitForTimeout(450);   // tween de 200 ms
  return norm(await page.locator('#simulador .kpis').innerText());
}

test.beforeEach(async ({ page }) => {
  await page.goto('/#simulador', { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.anchored === 'simulador');
  await expect(page.locator('#simulador .sim[data-ready="true"]')).toBeVisible();
});

test('«Condiciones del Hito 2» da −0,2 M€ y 7,9 %', async ({ page }) => {
  await page.getByRole('button', { name: 'Condiciones del Hito 2' }).click();
  const t = await kpis(page);
  expect(t).toContain('−0,2 M€');
  expect(t).toContain('7,9 %');
  expect(t).toContain('9,3 años');
  expect(t).toContain('7,02 €/kg');
});

test('«Hito 2 + ayudas» da 9,4 M€', async ({ page }) => {
  await page.getByRole('button', { name: 'Hito 2 + ayudas' }).click();
  const t = await kpis(page);
  expect(t).toContain('9,4 M€');
  expect(t).toContain('10,6 %');
});

test('«Prudente» y «Optimista» dan las cifras de la memoria', async ({ page }) => {
  await page.getByRole('button', { name: 'Prudente' }).click();
  let t = await kpis(page);
  expect(t).toContain('−18,1 M€'); expect(t).toContain('3,2 %'); expect(t).toContain('15,4 años'); expect(t).toContain('7,34 €/kg');
  await page.getByRole('button', { name: 'Optimista' }).click();
  t = await kpis(page);
  expect(t).toContain('+29,1 M€'); expect(t).toContain('15,1 %'); expect(t).toContain('5,7 años'); expect(t).toContain('6,07 €/kg');
});

test('el estado viaja en la URL y respeta #simulador', async ({ page }) => {
  await page.goto('/?p=8&y=0.16&ms=21500&cx=1&b=150&a=0.3#simulador', { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.anchored === 'simulador');
  await expect(page.locator('#simulador .sim[data-ready="true"]')).toBeVisible();
  expect(await kpis(page)).toContain('+29,1 M€');
});
