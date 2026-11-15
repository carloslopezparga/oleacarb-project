// Capturas de revisión (BRIEF §10.2) en docs/screens/: cada sección a 390 y 1440 px y estados intermedios.
// Uso: npm run build && npm run preview & node scripts/screens.mjs [baseURL]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:4321';
const OUT = 'docs/screens';
mkdirSync(OUT, { recursive: true });
const IDS = ['inicio', 'reto', 'territorio', 'proceso', 'planta', 'balances', 'calendario', 'simulador', 'impacto', 'video', 'equipo', 'fuentes'];
const shot = (p, name, opts = {}) => p.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 72, ...opts });

async function sweep(p) {
  await p.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
  });
}
async function section(p, id, name) {
  const r = await p.evaluate(i => { const el = document.getElementById(i); el.scrollIntoView(); const b = el.getBoundingClientRect(); return { y: b.top + scrollY, h: el.offsetHeight }; }, id);
  await p.waitForTimeout(900);
  await shot(p, name, { fullPage: true, clip: { x: 0, y: r.y, width: p.viewportSize().width, height: Math.min(r.h, 4200) } });
}
async function viajeAt(p, i, name) {
  await p.evaluate(i => document.querySelectorAll('.vrail button')[i].click(), i);
  await p.waitForTimeout(2300);
  await shot(p, name);
}

const browser = await chromium.launch();
for (const w of [390, 1440]) {
  const m = w < 600;
  const ctx = await browser.newContext({ viewport: { width: w, height: m ? 844 : 900 }, deviceScaleFactor: 1, isMobile: m, hasTouch: m });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await shot(p, `${w}-00-portada-pantalla`);
  await sweep(p);
  for (const [i, id] of IDS.entries()) await section(p, id, `${w}-${String(i + 1).padStart(2, '0')}-${id}`);
  // viaje de una tonelada: inicio, pasos 1, 3 y 5 (microestructura) y final
  await p.evaluate(() => document.getElementById('viaje').scrollIntoView());
  await p.waitForTimeout(800);
  for (const [i, n] of [[0, 'inicio'], [1, 'paso1'], [3, 'paso3'], [5, 'paso5-microestructura'], [8, 'final']]) await viajeAt(p, i, `${w}-viaje-${n}`);
  // Sankey en modo energía
  await p.evaluate(() => document.getElementById('balances').scrollIntoView());
  await p.waitForTimeout(800);
  await p.click('.sk-ctrl button:nth-child(2)');
  await p.waitForTimeout(1300);
  const sk = await p.locator('.sk').evaluate(e => { const r = e.getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: r.height }; });
  await shot(p, `${w}-balances-energia`, { clip: sk, fullPage: true });
  // simulador con cada escenario
  for (const name of ['Prudente', 'Condiciones del Hito 2', 'Hito 2 + ayudas', 'Optimista']) {
    await p.evaluate(() => document.getElementById('simulador').scrollIntoView());
    await p.getByRole('button', { name, exact: true }).click();
    await p.waitForTimeout(700);
    const box = await p.locator('#simulador .sim-grid').evaluate(e => { const r = e.getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; });
    await shot(p, `${w}-simulador-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, { fullPage: true, clip: { x: 0, y: box.y - 70, width: w, height: Math.min(box.h + 70, 2800) } });
  }
  // ficha de planta abierta y maqueta 3D
  await p.evaluate(() => document.getElementById('planta').scrollIntoView());
  await p.waitForTimeout(800);
  await p.locator('.zone[data-id="N2"]').first().dispatchEvent('click');
  await p.waitForTimeout(700);
  await shot(p, `${w}-planta-ficha`);
  // la maqueta 3D, en un navegador con WebGL por software
  const gl = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const gctx = await gl.newContext({ viewport: { width: w, height: m ? 844 : 900 }, isMobile: m, hasTouch: m });
  const gp = await gctx.newPage();
  await gp.goto(BASE + '/#planta', { waitUntil: 'networkidle' });
  await gp.waitForTimeout(1200);
  if (await gp.isVisible('.pl-3d')) {
    await gp.click('.pl-3d');
    await gp.locator('.p3d').evaluate(e => e.scrollIntoView({ block: 'center' }));
    await gp.waitForTimeout(3500);
    await shot(gp, `${w}-planta-3d`);
    await gp.click('.p3d-tour');
    await gp.waitForTimeout(9500);
    await shot(gp, `${w}-planta-3d-recorrido`);
  }
  await gl.close();
  // /video y 404
  await p.goto(BASE + '/video', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await shot(p, `${w}-video-pagina`);
  await p.goto(BASE + '/no-existe', { waitUntil: 'networkidle' });
  await shot(p, `${w}-404`);
  await ctx.close();
  // movimiento reducido: el viaje en siete bloques
  const rctx = await browser.newContext({ viewport: { width: w, height: m ? 844 : 900 }, reducedMotion: 'reduce', isMobile: m, hasTouch: m });
  const rp = await rctx.newPage();
  await rp.goto(BASE + '/', { waitUntil: 'networkidle' });
  await sweep(rp);
  await section(rp, 'viaje', `${w}-reducido-viaje`);
  await rctx.close();
}
await browser.close();
console.log('capturas en', OUT);
