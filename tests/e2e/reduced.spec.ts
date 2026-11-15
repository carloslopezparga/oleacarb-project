import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test('con movimiento reducido no hay secciones fijadas y todo se ve', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  expect(await page.locator('.pin-spacer').count()).toBe(0);
  for (const h of await page.locator('main section[id] h2').all()) await expect(h).toBeVisible();
  // el viaje se lee como siete pasos estáticos y el final
  const steps = page.locator('#viaje .vstep');
  expect(await steps.count()).toBe(9);
  for (const s of await steps.all()) {
    await s.scrollIntoViewIfNeeded();
    await expect(s).toBeVisible();
    expect(Number(await s.evaluate(e => getComputedStyle(e).opacity))).toBe(1);
  }
  // sin partículas
  expect(await page.locator('#proceso .st .dots').first().evaluate(e => getComputedStyle(e).display)).toBe('none');
});
