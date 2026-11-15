/* Portada: teselado de almendras (escena s1 del vídeo), iones Na⁺ que derivan hacia el puntero,
 * titular por líneas con SplitText y cifras que ruedan una sola vez. */
import { gsap, ScrollTrigger, reduced, coarse } from '../lib/motion';
import { SplitText } from 'gsap/SplitText';
import { num } from '../lib/format';

const C = { olive: '#8C9A55', oliveL: '#A3B465', ion: '#16AEBF' };

function almondPath(cx: number, cy: number, s: number): Path2D {
  // La misma almendra que la marca (brand/logo_mark.svg), escalada: altura 90·s.
  const p = new Path2D();
  p.moveTo(0, -45 * s);
  p.bezierCurveTo(31 * s, -23 * s, 31 * s, 23 * s, 0, 45 * s);
  p.bezierCurveTo(-31 * s, 23 * s, -31 * s, -23 * s, 0, -45 * s);
  p.closePath();
  const m = new DOMMatrix().translate(cx, cy).rotate(-32);
  const q = new Path2D();
  q.addPath(p, m);
  return q;
}

function hexPath(x: number, y: number, r: number): Path2D {
  const p = new Path2D();
  for (let i = 0; i < 6; i++) {
    const a = (60 * i + 30) * Math.PI / 180;
    const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
    if (i === 0) p.moveTo(px, py); else p.lineTo(px, py);
  }
  p.closePath();
  return p;
}

interface Ion { x: number; y: number; vx: number; vy: number; r: number; ph: number }

export function initHero(): void {
  const hero = document.getElementById('inicio');
  const canvas = hero?.querySelector<HTMLCanvasElement>('.hero-canvas');
  if (!hero || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, s = 1;
  let hexes: { p: Path2D; d: number }[] = [];
  let cache: HTMLCanvasElement | null = null;
  let almond: Path2D = new Path2D();
  let maxD = 1;
  const ions: Ion[] = [];
  const pointer = { x: -1, y: -1, on: false };
  const t0 = performance.now();

  // En escritorio los iones derivan por la mitad derecha, para no cruzar el titular.
  const xmin = () => (W < 900 ? W * 0.45 : W * 0.5);
  const ymax = () => (W < 900 ? Math.min(H * 0.4, 420) : H);

  function layout() {
    const r = hero!.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = r.width; H = r.height;
    canvas!.width = Math.round(W * dpr); canvas!.height = Math.round(H * dpr);
    const mobile = W < 900;
    const vh = Math.min(H, window.innerHeight || H);
    cx = mobile ? W * 0.84 : W * 0.75;
    cy = mobile ? Math.min(H * 0.2, 300) : vh * 0.5;
    s = mobile ? Math.min(W, H) * 0.0105 : vh * 0.86 / 90;
    almond = almondPath(cx, cy, s);
    const hr = mobile ? 16 : 26;
    const dx = hr * Math.sqrt(3), dy = hr * 1.5;
    hexes = [];
    const span = 50 * s;
    for (let j = -Math.ceil(span / dy); j <= Math.ceil(span / dy); j++) {
      for (let i = -Math.ceil(span / dx) - 1; i <= Math.ceil(span / dx) + 1; i++) {
        const x = cx + i * dx + (j % 2 ? dx / 2 : 0), y = cy + j * dy;
        if (x < -hr || x > W + hr || y < -hr || y > H + hr) continue;
        hexes.push({ p: hexPath(x, y, hr * 0.92), d: Math.hypot(x - cx, y - cy) });
      }
    }
    maxD = Math.max(1, ...hexes.map(h => h.d));
    // El teselado se pinta una sola vez en un lienzo aparte; cada fotograma solo lo copia.
    cache = document.createElement('canvas');
    cache.width = canvas!.width; cache.height = canvas!.height;
    const cx2 = cache.getContext('2d')!;
    cx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx2.save(); cx2.clip(almond); cx2.lineWidth = 1; cx2.strokeStyle = C.olive; cx2.globalAlpha = 0.28;
    for (const h of hexes) cx2.stroke(h.p);
    cx2.restore();
    const n = mobile ? 9 : 30;
    if (ions.length !== n) {
      ions.length = 0;
      for (let k = 0; k < n; k++) {
        ions.push({ x: xmin() + Math.random() * (W - xmin()), y: Math.random() * ymax(), vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: 2 + Math.random() * 1.6, ph: Math.random() * 6.28 });
      }
    }
  }

  function draw(now: number) {
    const t = (now - t0) / 1000;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, W, H);
    const k = reduced ? 1 : Math.min(1, t / 2.2);
    // teselado dentro de la almendra, que se revela desde el centro (círculo creciente sobre la copia en caché)
    if (cache) {
      const rev = reduced ? 1 : Math.min(1, Math.max(0, (t - 0.3) / 1.9));
      if (rev >= 1) ctx!.drawImage(cache, 0, 0, W, H);
      else if (rev > 0) {
        ctx!.save(); ctx!.beginPath(); ctx!.arc(cx, cy, maxD * (1 - Math.pow(1 - rev, 2)) + 1, 0, 6.2832); ctx!.clip();
        ctx!.drawImage(cache, 0, 0, W, H); ctx!.restore();
      }
    }
    // contorno de la almendra
    ctx!.globalAlpha = 0.85;
    ctx!.strokeStyle = C.oliveL;
    ctx!.lineWidth = 1.6;
    const L = 280 * s;
    ctx!.setLineDash([L, L]);
    ctx!.lineDashOffset = L * (1 - (1 - Math.pow(1 - k, 3)));
    ctx!.stroke(almond);
    ctx!.setLineDash([]);
    // iones de sodio
    for (const p of ions) {
      if (!reduced) {
        if (pointer.on) {
          const ddx = pointer.x - p.x, ddy = pointer.y - p.y, d2 = ddx * ddx + ddy * ddy + 900;
          p.vx += ddx / d2 * 0.9; p.vy += ddy / d2 * 0.9;
        }
        p.vx += Math.sin(t * .6 + p.ph) * 0.004; p.vy += Math.cos(t * .5 + p.ph) * 0.004;
        p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx; p.y += p.vy;
        if (p.x < xmin() - 10) p.x = W + 10; if (p.x > W + 10) p.x = xmin() - 10;
        if (p.y < -10) p.y = ymax() + 10; if (p.y > ymax() + 10) p.y = -10;
      }
      const a = reduced ? 0.8 : Math.min(1, Math.max(0, (t - 0.8) / 1.2));
      ctx!.globalAlpha = 0.14 * a;
      ctx!.fillStyle = C.ion;
      ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r * 4, 0, 6.2832); ctx!.fill();
      ctx!.globalAlpha = 0.9 * a;
      ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, 6.2832); ctx!.fill();
    }
    ctx!.globalAlpha = 1;
  }

  let raf = 0, visible = true;
  const loop = (now: number) => { draw(now); if (visible && !document.hidden) raf = requestAnimationFrame(loop); };

  layout();
  if (reduced) { draw(performance.now()); }
  else {
    raf = requestAnimationFrame(loop);
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    }).observe(hero);
    document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); if (!document.hidden && visible) raf = requestAnimationFrame(loop); });
    if (!coarse) {
      hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.on = true; });
      hero.addEventListener('pointerleave', () => { pointer.on = false; });
    } else if ('DeviceOrientationEvent' in window && typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission !== 'function') {
      // Android: la inclinación del móvil atrae los iones. En iOS haría falta pedir permiso, así que no se usa.
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma === null || e.beta === null) return;
        pointer.x = W / 2 + (e.gamma / 45) * W / 2; pointer.y = H / 2 + ((e.beta - 45) / 45) * H / 2; pointer.on = true;
      }, { passive: true });
    }
  }
  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = window.setTimeout(() => { layout(); if (reduced) draw(performance.now()); }, 150); });

  // Titular por líneas. Solo se parte cuando ya está su fuente (redonda 600 y cursiva 500 de Source Serif),
  // para no rehacer las líneas después y mover la entradilla. Si la fuente tarda más de 1 s, el titular aparece sin animación.
  const h1 = hero.querySelector<HTMLElement>('h1');
  if (h1) {
    const show = () => h1.classList.add('split');
    if (reduced) show();
    else {
      const fontsIn = Promise.all([
        document.fonts.load('600 48px "Source Serif 4"', 'Del hueso'),
        document.fonts.load('italic 500 48px "Source Serif 4"', 'ánodo')
      ]).then(() => true, () => false);
      Promise.race([fontsIn, new Promise<boolean>(r => setTimeout(() => r(false), 1000))]).then((ok) => {
        if (!ok || h1.classList.contains('split')) { show(); return; }
        const split = SplitText.create(h1, { type: 'lines', mask: 'lines', linesClass: 'ln' });
        show();
        gsap.from(split.lines, { yPercent: 108, duration: 1.0, ease: 'expo.out', stagger: 0.08, delay: 0.02,
          onComplete: () => split.revert() });
      });
    }
  }

  // Paralaje ligero de la foto
  const bg = hero.querySelector('.hero-bg');
  if (bg && !reduced) {
    gsap.to(bg, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  // Cifras: ruedan una vez, la primera vez que entran en pantalla
  const cnts = [...hero.querySelectorAll<HTMLElement>('.cnt')];
  const roll = (el: HTMLElement) => {
    const to = Number(el.dataset.to), d = Number(el.dataset.d || 0);
    const live = el.querySelector<HTMLElement>('.live')!;
    el.classList.add('run');
    if (reduced || to === 0) { live.textContent = num(to, d); return; }
    const o = { v: 0 };
    live.textContent = num(0, d);
    gsap.to(o, { v: to, duration: 1.4, ease: 'power3.out', onUpdate: () => { live.textContent = num(o.v, d); } });
  };
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); roll(e.target as HTMLElement); } }), { threshold: 0.6 });
  cnts.forEach(c => io.observe(c));
  void ScrollTrigger;
}
