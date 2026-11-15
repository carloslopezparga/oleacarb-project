import { test, expect } from '@playwright/test';

for (const width of [360, 375, 390, 768, 1024, 1440]) {
  test(`sin scroll horizontal a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(300);
    // recorre la página para que se monten las piezas que esperan a entrar en pantalla
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); }
    });
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    expect(sw).toBeLessThanOrEqual(iw);
  });
}

test('la página /404 enlaza a la portada', async ({ page }) => {
  const res = await page.goto('/no-existe');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('link', { name: 'Ir a la portada' })).toHaveAttribute('href', '/');
});
