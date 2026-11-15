/* El viaje de una tonelada: sección fijada con scrub.
 * El timeline solo anima un objeto de estado; render() traduce ese estado al SVG y al texto.
 * Así el scrub hacia atrás deja todo exactamente como estaba. */
import { gsap, ScrollTrigger, reduced, coarse } from '../lib/motion';
import { headerHeight } from '../lib/anchors';
import { getLenis } from '../lib/motion';
import { num } from '../lib/format';

const OCHRE = '#B9862C', OCHRE_L = '#D6A54A', BLACK = '#0E1010';

export function initViaje(): void {
  const sec = document.getElementById('viaje');
  if (!sec || reduced) return;
  const pin = sec.querySelector<HTMLElement>('.vpin')!;
  const svg = sec.querySelector<SVGSVGElement>('.vsvg')!;
  const q = <T extends Element>(s: string) => svg.querySelector<T>(s)!;
  const bone = q<SVGGElement>('.bone');
  const CX = Number(bone.dataset.cx), CY = Number(bone.dataset.cy), K = Number(bone.dataset.k);
  const alm = q<SVGPathElement>('.alm'), rim = q<SVGPathElement>('.alm-rim');
  const hexes = q<SVGGElement>('.hexes'), heat = q<SVGCircleElement>('.heat');
  const cracks = [...svg.querySelectorAll<SVGPathElement>('.cracks path')];
  const powder = q<SVGGElement>('.powder');
  const micro = q<SVGGElement>('.micro'), lensC = q<SVGCircleElement>('.lens-c'), lensRing = q<SVGCircleElement>('.lens-ring');
  const ions = [...micro.querySelectorAll<SVGCircleElement>('.na')].map(el => ({ el, sx: Number(el.dataset.sx), sy: Number(el.dataset.sy) }));
  const cell = q<SVGGElement>('.cell'), coat = q<SVGRectElement>('.coat'), spiral = q<SVGPathElement>('.spiral');
  const rollIon = cell.querySelector<SVGElement>('.roll .na')!, rollT = cell.querySelector<SVGElement>('.na-t')!;
  const coatW = Number(coat.getAttribute('width'));
  const parts = [...svg.querySelectorAll<SVGElement>('.pt')];
  const groups: { el: SVGElement; dx: number; dy: number; j: number; n: number }[][] = [[], [], [], [], [], [], []];
  parts.forEach(el => { const s = Number(el.dataset.step); groups[s].push({ el, dx: Number(el.dataset.dx), dy: Number(el.dataset.dy), j: groups[s].length, n: 0 }); });
  groups.forEach(g => g.forEach(p => { p.n = g.length; }));
  const kgEl = sec.querySelector<HTMLElement>('.kg')!, tcEl = sec.querySelector<HTMLElement>('.tc')!;
  const massFill = sec.querySelector<HTMLElement>('.vfill-mass')!, tFill = sec.querySelector<HTMLElement>('.vfill-t')!;
  const stepsEls = [...sec.querySelectorAll<HTMLElement>('.vstep')];
  const rail = [...sec.querySelectorAll<HTMLButtonElement>('.vrail button')];

  const mix = gsap.utils.interpolate(OCHRE, BLACK) as (t: number) => string;
  const dry = gsap.utils.interpolate(OCHRE, OCHRE_L) as (t: number) => string;

  // Estado y fotogramas clave al final de cada paso (process.json → por_tonelada)
  const st = { kg: 1000, temp: 20, sc: 1, col: 0, crack: 0, hex: 0, bone: 1, powder: 0, lens: 0, ions: 0, cell: 0, coat: 0, roll: 0, p: [0, 0, 0, 0, 0, 0, 0] };
  const kgs = [1000, 980, 872.2, 178.801, 173.43697, 143.952685, 124.6, 124.6, 124.6];
  const temps = [20, 20, 100, 550, 40, 1300, 40, 30, 30];
  const dur = [1, 1, 1, 1, 1.9, 1.3, 1, 1.5];        // duración de cada tramo (unidades de timeline)
  const L = [0]; dur.forEach(d => L.push(L[L.length - 1] + d));

  // color: 0 ocre, −1 seco (más claro), 0→1 hacia negro
  const colorOf = (c: number) => (c < 0 ? dry(-c) : mix(c));
  const sc = (kg: number) => Math.cbrt(kg / 1000);

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power1.inOut' }, onUpdate: render });
  for (let i = 1; i <= 8; i++) tl.addLabel('s' + (i - 1), L[i - 1]);
  tl.addLabel('s8', L[8]);

  const seg = (i: number, a: number, b: number) => [L[i - 1] + dur[i - 1] * a, dur[i - 1] * (b - a)] as const;
  // pasos 1–4 y 6–7: masa, escala, temperatura y partículas de su salida
  const basic = (i: number, extra: Record<string, number> = {}) => {
    const [t0, d] = seg(i, 0.12, 0.8);
    tl.to(st, { kg: kgs[i], sc: sc(kgs[i]), temp: temps[i], duration: d, ...extra }, t0);
    if (i <= 6) {
      const [p0, pd] = seg(i, 0.08, 0.95);
      tl.to(st.p, { [i]: 1, duration: pd, ease: 'none' }, p0);
    }
  };
  basic(1);
  basic(2, { col: -0.45 });
  basic(3, { col: 0.86 });
  tl.to(st, { crack: 1, duration: dur[2] * 0.5 }, L[2] + dur[2] * 0.3);
  basic(4, { col: 0.9 });
  // paso 5: carbonización y entrada en la microestructura
  {
    const [t0, d] = seg(5, 0.06, 0.4);
    tl.to(st, { kg: kgs[5], sc: sc(kgs[5]), temp: temps[5], col: 1, hex: 1, duration: d }, t0);
    const [p0, pd] = seg(5, 0.04, 0.5);
    tl.to(st.p, { 5: 1, duration: pd, ease: 'none' }, p0);
    const [l0, ld] = seg(5, 0.42, 0.68);
    tl.to(st, { lens: 1, duration: ld, ease: 'power2.inOut' }, l0);
    const [i0, id] = seg(5, 0.6, 0.94);
    tl.to(st, { ions: 1, duration: id, ease: 'none' }, i0);
  }
  // paso 6: salir de la lente, moler
  {
    const [l0, ld] = seg(6, 0.0, 0.3);
    tl.to(st, { lens: 0, duration: ld }, l0);
    basic(6);
    const [b0, bd] = seg(6, 0.35, 0.75);
    tl.to(st, { bone: 0, powder: 1, duration: bd }, b0);
  }
  basic(7);
  // final: la celda
  {
    const [c0, cd] = seg(8, 0.05, 0.3);
    tl.to(st, { cell: 1, powder: 0, duration: cd }, c0);
    const [k0, kd] = seg(8, 0.3, 0.62);
    tl.to(st, { coat: 1, duration: kd }, k0);
    const [r0, rd] = seg(8, 0.62, 0.95);
    tl.to(st, { roll: 1, duration: rd }, r0);
  }

  const ease = gsap.parseEase('power2.out');
  let active = -1;
  function render() {
    const t = tl.time();
    bone.setAttribute('transform', `translate(${CX} ${CY}) scale(${(K * st.sc).toFixed(4)})`);
    bone.style.opacity = st.bone.toFixed(3);
    alm.setAttribute('fill', colorOf(st.col));
    rim.style.opacity = (0.4 + 0.6 * Math.max(0, st.col)).toFixed(3);
    hexes.style.opacity = (st.hex * 0.9).toFixed(3);
    cracks.forEach(c => { c.style.strokeDashoffset = String(1 - st.crack); c.style.opacity = (0.35 + 0.65 * Math.min(1, st.temp / 600)).toFixed(3); });
    heat.setAttribute('opacity', (0.9 * Math.pow(Math.max(0, st.temp - 60) / 1240, 1.4)).toFixed(3));
    powder.style.opacity = st.powder.toFixed(3);
    powder.setAttribute('transform', `translate(${CX} ${CY}) scale(${(0.7 + 0.3 * st.powder).toFixed(3)}) translate(${-CX} ${-CY})`);
    // partículas de cada salida
    for (let g = 1; g <= 6; g++) {
      const p = st.p[g];
      for (const it of groups[g]) {
        const delay = (it.j / it.n) * 0.45, u = Math.max(0, Math.min(1, (p - delay) / 0.55));
        if (u <= 0 || u >= 1) { if (it.el.style.opacity !== '0') it.el.style.opacity = '0'; continue; }
        const e = ease(u);
        it.el.setAttribute('transform', `translate(${(it.dx * e).toFixed(1)} ${(it.dy * e).toFixed(1)})`);
        it.el.style.opacity = (u < 0.08 ? u / 0.08 : u > 0.75 ? (1 - u) / 0.25 : 1).toFixed(3);
      }
    }
    // lente de la microestructura
    const R = st.lens * 360;
    lensC.setAttribute('r', R.toFixed(1));
    lensRing.setAttribute('r', R.toFixed(1));
    micro.style.display = st.lens > 0.002 ? '' : 'none';
    ions.forEach((o, k) => {
      const d = (k / ions.length) * 0.5, u = ease(Math.max(0, Math.min(1, (st.ions - d) / 0.5)));
      o.el.setAttribute('transform', `translate(${(o.sx * (1 - u)).toFixed(1)} ${(o.sy * (1 - u)).toFixed(1)})`);
      o.el.style.opacity = st.ions > d ? '1' : '0';
    });
    // celda
    cell.style.opacity = st.cell.toFixed(3);
    coat.setAttribute('width', (coatW * st.coat).toFixed(1));
    spiral.style.strokeDashoffset = String(1 - st.roll);
    const ionOn = st.roll > 0.85 ? '1' : '0';
    rollIon.style.opacity = ionOn; rollT.style.opacity = ionOn;
    // masa y temperatura
    kgEl.textContent = st.kg >= 999.95 ? num(1000) : num(st.kg, 1);
    massFill.style.transform = `scaleY(${(st.kg / 1000).toFixed(4)})`;
    tFill.style.transform = `scaleY(${(st.temp / 1300).toFixed(4)})`;
    // paso activo
    let a = 0;
    for (let i = 1; i <= 8; i++) if (t > L[i - 1] + dur[i - 1] * 0.08) a = i;
    tcEl.textContent = a === 2 && Math.abs(st.temp - 100) < 2 ? '90–110' : num(st.temp);
    if (a !== active) {
      active = a;
      stepsEls.forEach((el, i) => el.classList.toggle('is-on', i === a));
      rail.forEach((b, i) => { b.classList.toggle('is-on', i === a); b.classList.toggle('is-done', i < a); b.setAttribute('aria-current', i === a ? 'step' : 'false'); });
    }
  }

  const units = L[8];
  const trig = ScrollTrigger.create({
    trigger: sec,
    pin,
    start: () => `top ${headerHeight()}`,
    end: () => `+=${Math.round(units * window.innerHeight * (coarse ? 0.62 : 0.72))}`,
    scrub: coarse ? true : 0.5,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    animation: tl,
    snap: coarse ? undefined : { snapTo: 'labelsDirectional', inertia: false, duration: { min: 0.2, max: 0.6 }, delay: 0.15, ease: 'power1.inOut' }
  });

  rail.forEach((b, i) => b.addEventListener('click', () => {
    const y = trig.start + (trig.end - trig.start) * (L[i] / units) + (i === 0 ? 0 : -2);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y + 1, { duration: 1 });
    else window.scrollTo({ top: y + 1, behavior: 'smooth' });
  }));
  sec.classList.add('is-pinned');
  render();
}
