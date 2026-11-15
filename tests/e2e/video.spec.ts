import { test, expect } from '@playwright/test';

test('/video carga con src y póster, y el MP4 admite rangos', async ({ page, request }) => {
  await page.goto('/video', { waitUntil: 'load' });
  await expect(page.locator('h1')).toContainText('La planta en 79');
  const video = page.locator('video');
  await expect(video).toHaveAttribute('poster', /poster/);
  await expect.poll(async () => video.evaluate((v: HTMLVideoElement) => v.currentSrc || v.getAttribute('src') || '')).toMatch(/oleacarb-(720|1080)\.mp4/);
  const src = await video.evaluate((v: HTMLVideoElement) => v.getAttribute('src')!);
  const res = await request.get(src, { headers: { Range: 'bytes=0-1023' } });
  expect(res.status(), 'admite peticiones por rangos').toBe(206);
  const full = await request.head(src);
  expect(full.status()).toBe(200);
  // El servidor local de vista previa no envía la cabecera aunque sirve rangos; en producción (Vercel) es obligatoria.
  if (process.env.E2E_BASE_URL) expect(full.headers()['accept-ranges']).toBe('bytes');
});

test('/video tiene las etiquetas Open Graph del vídeo', async ({ page }) => {
  await page.goto('/video');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'video.other');
  await expect(page.locator('meta[property="og:video"]')).toHaveAttribute('content', /^https:\/\/.+oleacarb-720\.mp4$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-video\.jpg$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
});
