/* PFD vivo: fichas de corriente (hover, foco o toque) y paneles de etapa. */
import { BottomSheet } from '../lib/sheet';
import { num } from '../lib/format';
import processData from '../data/process.json';

const STREAMS = Object.fromEntries(processData.streams.map(s => [s.id, s]));
const T = ' ';

function fichaHTML(id: string): string {
  const s = STREAMS[id];
  return `<span class="fn">Corriente ${s.id}</span><b>${s.name}</b><dl>
    <dt>caudal</dt><dd>${num(s.ta)}${T}t/año · ${num(s.th, 2)}${T}t/h</dd>
    <dt>temperatura</dt><dd>${num(s.T)}${T}°C</dd>
    <dt>de</dt><dd>${s.frm}</dd><dt>a</dt><dd>${s.to}</dd></dl>`;
}

export function initProceso(): void {
  const sec = document.getElementById('proceso');
  if (!sec) return;
  const mq = matchMedia('(max-width: 760px)');
  const sheetEl = sec.querySelector<HTMLElement>('.pfd-sheet')!;
  // La hoja inferior va al <body>: dentro de la sección, content-visibility la anclaría a ella y no a la pantalla.
  document.body.appendChild(sheetEl);
  const sheet = new BottomSheet(sheetEl, () => { sec.querySelectorAll('.st.is-on').forEach(e => e.classList.remove('is-on')); });
  const wrap = sec.querySelector<HTMLElement>('.pfd-wrap')!;
  const ficha = sec.querySelector<HTMLElement>('.ficha')!;
  const tabs = [...sec.querySelectorAll<HTMLButtonElement>('.stage-tabs [role="tab"]')];
  const panels = [...sec.querySelectorAll<HTMLElement>('.spanel')];
  const stages = [...sec.querySelectorAll<SVGGElement>('.stage')];
  const streams = [...sec.querySelectorAll<SVGGElement>('.st')];

  // Solo el diagrama visible es navegable con el teclado.
  const syncVariant = () => {
    sec.querySelector('.pfd-desk')?.setAttribute('aria-hidden', String(mq.matches));
    sec.querySelector('.pfd-mob')?.setAttribute('aria-hidden', String(!mq.matches));
    sec.querySelectorAll<SVGGElement>('.pfd-desk [tabindex]').forEach(g => g.setAttribute('tabindex', mq.matches ? '-1' : '0'));
    sec.querySelectorAll<SVGGElement>('.pfd-mob [tabindex]').forEach(g => g.setAttribute('tabindex', mq.matches ? '0' : '-1'));
  };
  syncVariant();
  mq.addEventListener('change', () => { syncVariant(); sheet.close(); hideFicha(); });

  function select(i: number, fromUser = true) {
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => { p.hidden = k !== i; });
    stages.forEach(g => g.classList.toggle('is-on', Number(g.dataset.i) === i));
    if (fromUser && mq.matches) {
      const clone = panels[i].cloneNode(true) as HTMLElement;
      clone.hidden = false; clone.removeAttribute('id'); clone.removeAttribute('role');
      sheet.open(clone);
      clone.querySelector('.to-viaje')?.addEventListener('click', () => sheet.close());
    }
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault(); e.stopPropagation();
      const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      select(n, false); tabs[n].focus();
    });
  });
  stages.forEach(g => {
    const i = Number(g.dataset.i);
    g.addEventListener('click', () => { select(i); if (!mq.matches) tabs[i].scrollIntoView({ block: 'nearest' }); });
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i); } });
  });

  // Fichas de corriente
  let pinned: string | null = null;
  function showFicha(id: string, x: number, y: number) {
    ficha.innerHTML = fichaHTML(id);
    ficha.hidden = false;
    const W = wrap.clientWidth, fw = ficha.offsetWidth, fh = ficha.offsetHeight;
    const left = Math.min(Math.max(8, x + 16), W - fw - 8);
    const top = y - fh - 14 < 0 ? y + 18 : y - fh - 14;
    ficha.style.left = left + 'px'; ficha.style.top = top + 'px';
    streams.forEach(s => s.classList.toggle('is-on', s.dataset.s === id));
  }
  function hideFicha() { ficha.hidden = true; pinned = null; streams.forEach(s => s.classList.remove('is-on')); }
  const local = (e: { clientX: number; clientY: number }) => { const r = wrap.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  streams.forEach(g => {
    const id = g.dataset.s!;
    g.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !pinned) { const [x, y] = local(e); showFicha(id, x, y); } });
    g.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && !pinned) { const [x, y] = local(e); showFicha(id, x, y); } });
    g.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !pinned) hideFicha(); });
    g.addEventListener('click', (e) => {
      if (mq.matches) {
        streams.forEach(s => s.classList.toggle('is-on', s.dataset.s === id));
        sheet.open(`<div class="ficha-m">${fichaHTML(id)}</div>`);
        return;
      }
      const [x, y] = local(e); pinned = pinned === id ? null : id;
      if (pinned) showFicha(id, x, y); else hideFicha();
    });
    g.addEventListener('focus', () => {
      if (mq.matches) return;
      const b = g.querySelector('.badge')!.getBoundingClientRect(), r = wrap.getBoundingClientRect();
      showFicha(id, b.left - r.left + b.width / 2, b.top - r.top);
    });
    g.addEventListener('blur', () => { if (!pinned) hideFicha(); });
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); g.dispatchEvent(new MouseEvent('click', { clientX: 0, clientY: 0 })); }
      if (e.key === 'Escape') hideFicha();
    });
  });
  document.addEventListener('click', (e) => { if (pinned && !(e.target as Element).closest('.st')) hideFicha(); });
  select(0, false);
}
