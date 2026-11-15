import { test, expect } from '@playwright/test';

// Anclas de BRIEF §2. #proceso, #planta y #simulador van impresas en QR.
const IDS = ['inicio', 'reto', 'territorio', 'viaje', 'proceso', 'planta', 'balances', 'calendario', 'simulador', 'impacto', 'video', 'fuentes'];

for (const id of IDS) {
  test(`#${id} en carga en frío deja su titular visible bajo la cabecera`, async ({ page }) => {
    await page.goto(`/#${id}`, { waitUntil: 'load' });
    await page.waitForFunction(i => document.documentElement.dataset.anchored === i, id);
    await page.waitForTimeout(400);
    const r = await page.evaluate(i => {
      const sec = document.getElementById(i)!;
      const h = sec.querySelector('h1, h2')!.getBoundingClientRect();
      const head = document.querySelector('.site-head')!.getBoundingClientRect();
      return { top: h.top, bottom: h.bottom, headBottom: head.bottom, vh: innerHeight, pins: document.querySelectorAll('.pin-spacer').length };
    }, id);
    expect(r.top, 'el titular no queda tapado por la cabecera').toBeGreaterThanOrEqual(r.headBottom - 1);
    expect(r.bottom, 'el titular cabe en la pantalla').toBeLessThanOrEqual(r.vh);
    if (id !== 'inicio') expect(r.top, 'el titular está cerca del borde superior').toBeLessThan(r.vh * 0.6);
  });
}

test('las secciones fijadas de GSAP están montadas al llegar con hash', async ({ page }) => {
  await page.goto('/#simulador', { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.anchored === 'simulador');
  expect(await page.locator('.pin-spacer').count()).toBeGreaterThan(0);
});

// El fijado del viaje no puede asomar sobre las secciones de los QR. Las fuentes se retrasan como con datos móviles:
// al llegar cambian el alto de lo que hay encima y es cuando la sección se desplazaba.
for (const id of ['proceso', 'planta']) {
  test(`en carga en frío de /#${id} el riel del viaje no se ve`, async ({ page }) => {
    await page.route(/\.woff2(\?.*)?$/, async route => { await new Promise(r => setTimeout(r, 1200)); await route.continue(); });
    await page.goto(`/#${id}`, { waitUntil: 'load' });
    await page.waitForFunction(i => document.documentElement.dataset.anchored === i, id);
    await page.waitForTimeout(800);
    const r = await page.evaluate(i => {
      const rail = document.querySelector('.vrail')!.getBoundingClientRect();
      const pin = document.querySelector('.vpin')!.getBoundingClientRect();
      const head = document.querySelector('.site-head')!.getBoundingClientRect();
      const h2 = document.getElementById(i)!.querySelector('h2')!.getBoundingClientRect();
      return { railTop: rail.top, railBottom: rail.bottom, pinBottom: pin.bottom, headBottom: head.bottom, vh: innerHeight, h2: h2.top };
    }, id);
    const hidden = (top: number, bottom: number) => bottom <= r.headBottom + 0.5 || top >= r.vh;
    expect(hidden(r.railTop, r.railBottom), `riel del viaje en ${Math.round(r.railTop)}–${Math.round(r.railBottom)}`).toBe(true);
    expect(r.pinBottom, 'el panel fijado del viaje no baja de la cabecera').toBeLessThanOrEqual(r.headBottom + 0.5);
    expect(r.h2).toBeGreaterThanOrEqual(r.headBottom - 1);
  });
}
