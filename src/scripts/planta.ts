/* Plano navegable: zoom (rueda tras hacer clic, pellizco con dos dedos, botones y teclado), arrastre,
 * chips de categoría, ruta del material y selección de edificios (abre la ficha). La maqueta 3D se carga bajo demanda. */
import { reduced } from '../lib/motion';

export function initPlanta(): void {
  const sec = document.getElementById('planta');
  if (!sec) return;
  const map = sec.querySelector<HTMLElement>('.pl-map')!;
  const svg = sec.querySelector<SVGSVGElement>('.plan')!;
  const hint = sec.querySelector<HTMLElement>('.pl-hint')!;
  const [bx, by, bw, bh] = svg.dataset.vb!.split(' ').map(Number);
  const base = { x: bx, y: by, w: bw, h: bh };
  let vb = { ...base };
  const MIN_W = base.w / 6;

  const setVB = () => {
    svg.setAttribute('viewBox', `${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`);
    // unidades de plano por píxel de pantalla: los rótulos mantienen su tamaño al acercar
    const px = svg.getBoundingClientRect().width || 600;
    svg.style.setProperty('--upx', (vb.w / px).toFixed(4));
    svg.classList.toggle('dense', vb.w / px > 0.45);   // plano muy reducido: se ocultan los rótulos largos
  };
  const clamp = () => {
    vb.x = Math.min(Math.max(vb.x, base.x), base.x + base.w - vb.w);
    vb.y = Math.min(Math.max(vb.y, base.y), base.y + base.h - vb.h);
  };
  function zoom(f: number, cx?: number, cy?: number) {
    const nw = Math.min(base.w, Math.max(MIN_W, vb.w * f)), nh = nw * base.h / base.w;
    if (cx === undefined || cy === undefined) { cx = vb.x + vb.w / 2; cy = vb.y + vb.h / 2; }
    vb.x = cx - (cx - vb.x) * nw / vb.w; vb.y = cy - (cy - vb.y) * nh / vb.h; vb.w = nw; vb.h = nh;
    clamp(); setVB();
  }
  const toSvg = (clientX: number, clientY: number) => {
    const r = svg.getBoundingClientRect();
    return { x: vb.x + (clientX - r.left) / r.width * vb.w, y: vb.y + (clientY - r.top) / r.height * vb.h };
  };
  setVB();
  new ResizeObserver(() => setVB()).observe(svg);

  sec.querySelectorAll<HTMLButtonElement>('.pl-zoom button').forEach(b => b.addEventListener('click', () => {
    const z = b.dataset.z;
    if (z === 'in') zoom(0.7); else if (z === 'out') zoom(1 / 0.7); else { vb = { ...base }; setVB(); }
  }));

  // Rueda: solo cuando el plano está activo (tras un clic) o con Ctrl, para no secuestrar el scroll de la página.
  let active = false;
  let hintT = 0;
  const showHint = (txt: string) => { hint.textContent = txt; hint.classList.add('is-on'); clearTimeout(hintT); hintT = window.setTimeout(() => hint.classList.remove('is-on'), 1400); };
  map.addEventListener('pointerdown', () => { active = true; });
  document.addEventListener('pointerdown', (e) => { if (!map.contains(e.target as Node)) active = false; });
  svg.addEventListener('wheel', (e) => {
    if (!active && !e.ctrlKey && !e.metaKey) { showHint('Haz clic en el plano para acercar con la rueda'); return; }
    e.preventDefault(); e.stopPropagation();
    const p = toSvg(e.clientX, e.clientY);
    zoom(e.deltaY > 0 ? 1.15 : 0.87, p.x, p.y);
  }, { passive: false });

  // Arrastre con ratón; con el dedo, pellizco y desplazamiento a dos dedos (un dedo deja desplazar la página).
  const ptrs = new Map<number, { x: number; y: number; type: string }>();
  let pinch0: { d: number; w: number } | null = null;
  let moved = false;
  svg.addEventListener('pointerdown', (e) => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    moved = false;
    if (e.pointerType === 'mouse') { svg.setPointerCapture(e.pointerId); svg.classList.add('is-drag'); }
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), w: vb.w };
      [...ptrs.keys()].forEach(id => { try { svg.setPointerCapture(id); } catch { /* */ } });
    }
  });
  svg.addEventListener('pointermove', (e) => {
    const prev = ptrs.get(e.pointerId);
    if (!prev) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    if (ptrs.size === 2 && pinch0) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const c = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
      zoom((pinch0.w * pinch0.d / d) / vb.w, c.x, c.y);
      const r = svg.getBoundingClientRect();
      vb.x -= (e.clientX - prev.x) / 2 / r.width * vb.w; vb.y -= (e.clientY - prev.y) / 2 / r.height * vb.h;
      clamp(); setVB(); moved = true;
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const r = svg.getBoundingClientRect();
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
    vb.x -= dx / r.width * vb.w; vb.y -= dy / r.height * vb.h; clamp(); setVB();
  });
  const up = (e: PointerEvent) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null; if (!ptrs.size) svg.classList.remove('is-drag'); };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('touchstart', (e) => { if (e.touches.length === 2) e.preventDefault(); }, { passive: false });

  // Teclado sobre el plano
  map.addEventListener('keydown', (e) => {
    if (e.target !== map) return;
    const step = vb.w * 0.1;
    if (e.key === '+' || e.key === '=') zoom(0.8);
    else if (e.key === '-') zoom(1.25);
    else if (e.key === 'ArrowLeft') { vb.x -= step; clamp(); setVB(); }
    else if (e.key === 'ArrowRight') { vb.x += step; clamp(); setVB(); }
    else if (e.key === 'ArrowUp') { vb.y -= step; clamp(); setVB(); }
    else if (e.key === 'ArrowDown') { vb.y += step; clamp(); setVB(); }
    else return;
    e.preventDefault(); e.stopPropagation();
  });

  // Selección de edificios
  const zones = [...svg.querySelectorAll<SVGGElement>('.zone')];
  const select = (id: string) => {
    zones.forEach(z => z.classList.toggle('is-on', z.dataset.id === id));
    window.dispatchEvent(new CustomEvent('plant:select', { detail: { id } }));
  };
  zones.forEach(z => {
    z.addEventListener('click', () => { if (!moved) select(z.dataset.id!); });
    z.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(z.dataset.id!); } });
  });
  zones.find(z => z.dataset.id === 'N4')?.classList.add('is-on');
  window.addEventListener('plant:select', (e) => {
    const id = (e as CustomEvent<{ id: string }>).detail.id;
    zones.forEach(z => z.classList.toggle('is-on', z.dataset.id === id));
  });

  // Chips de categoría: resaltan su grupo
  const chips = [...sec.querySelectorAll<HTMLButtonElement>('.chip')];
  chips.forEach(c => c.addEventListener('click', () => {
    const on = c.getAttribute('aria-pressed') !== 'true';
    chips.forEach(o => o.setAttribute('aria-pressed', String(o === c && on)));
    svg.classList.toggle('has-cat', on);
    zones.forEach(z => z.classList.toggle('is-cat', on && z.dataset.cat === c.dataset.cat));
  }));

  const routeBtn = sec.querySelector<HTMLButtonElement>('.pl-route')!;
  routeBtn.addEventListener('click', () => {
    const on = routeBtn.getAttribute('aria-pressed') !== 'true';
    routeBtn.setAttribute('aria-pressed', String(on));
    svg.classList.toggle('no-route', !on);
  });

  // Maqueta 3D: solo si hay WebGL y al menos 4 hilos
  const btn3d = sec.querySelector<HTMLButtonElement>('.pl-3d')!;
  const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
  if (hasGL && (navigator.hardwareConcurrency || 0) >= 4) {
    btn3d.hidden = false;
    btn3d.addEventListener('click', async () => {
      btn3d.disabled = true; btn3d.textContent = 'Cargando…';
      const m = await import('./plant3d');
      await m.open3D(sec, { reduced, onClose: () => { btn3d.disabled = false; btn3d.textContent = 'Ver en 3D'; btn3d.focus(); } });
      btn3d.textContent = 'Ver en 3D';
    });
  }
}
