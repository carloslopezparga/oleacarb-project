<script lang="ts">
  /* Sankey de materia y energía con selector. Al cambiar de modo las bandas se reordenan
     (se interpolan sus seis números), no hay corte. */
  import type { Geo, Band, Orient } from '../lib/sankey';
  import { bandPath, bandCenter } from '../lib/sankey';

  let { geo }: { geo: { mass: { h: Geo; v: Geo }; energy: { h: Geo; v: Geo } } } = $props();

  type Mode = 'mass' | 'energy';
  let mode: Mode = $state('mass');
  let t = $state(1);          // progreso de la transición (1 = en reposo)
  let from: Mode = $state('mass');
  let info: Band | null = $state(null);
  let pinned = false;

  // Emparejamiento por caudal: la banda mayor de un modo pasa a ser la mayor del otro.
  function slots(o: Orient) {
    const m = [...geo.mass[o].bands].sort((a, b) => b.v - a.v);
    const e = [...geo.energy[o].bands].sort((a, b) => b.v - a.v);
    const n = Math.max(m.length, e.length);
    const collapse = (b: Band): Band => {
      const [x0, a0, b0, x1, a1, b1] = b.g, c0 = (a0 + b0) / 2, c1 = (a1 + b1) / 2;
      return { ...b, g: [x0, c0, c0, x1, c1, c1] };
    };
    return Array.from({ length: n }, (_, i) => ({
      mass: m[i] ?? collapse(e[i]), energy: e[i] ?? collapse(m[i]),
      inMass: i < m.length, inEnergy: i < e.length
    }));
  }
  const S = { h: slots('h'), v: slots('v') };
  type Slot = (typeof S.h)[number];

  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const lerp = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k);
  const present = (slot: Slot, m: Mode) => (m === 'mass' ? slot.inMass : slot.inEnergy) ? 1 : 0;

  function geomOf(slot: Slot): number[] {
    if (t >= 1) return slot[mode].g;
    return lerp(slot[from].g, slot[mode].g, ease(t));
  }
  function opacityOf(slot: Slot): number {
    const a = present(slot, from), b = present(slot, mode);
    return t >= 1 ? b : a + (b - a) * ease(t);
  }

  function setMode(m: Mode) {
    if (m === mode) return;
    info = null; pinned = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    from = mode; mode = m;
    if (reduced) { t = 1; return; }
    t = 0;
    const t0 = performance.now(), D = 900;
    const step = (now: number) => { t = Math.min(1, (now - t0) / D); if (t < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  const show = (b: Band) => { if (!pinned) info = b; };
  const hide = () => { if (!pinned) info = null; };
  const pin = (b: Band) => { pinned = !(pinned && info === b); info = pinned ? b : null; };
</script>

<div class="sk" data-mode={mode}>
  <div class="sk-ctrl" role="group" aria-label="Tipo de balance">
    <button type="button" class="btn btn--line" aria-pressed={mode === 'mass'} onclick={() => setMode('mass')}>Materia <span class="mono">t/año</span></button>
    <button type="button" class="btn btn--line" aria-pressed={mode === 'energy'} onclick={() => setMode('energy')}>Energía <span class="mono">GWh/año</span></button>
  </div>

  {#each (['h', 'v'] as const) as o (o)}
    {@const G = geo[mode][o]}
    <svg class={`sk-svg sk-${o}`} viewBox={`0 0 ${G.w} ${G.h}`} role="img"
      aria-label={mode === 'mass'
        ? 'Diagrama de Sankey del balance de materia: de 24.157 toneladas de hueso recibido salen agua, rechazos, volátiles, minerales, gases, hard carbon y carbón activo.'
        : 'Diagrama de Sankey del balance de energía: de 77,6 GWh de gases de proceso salen calor de proceso, electricidad del ORC, calor a 80 °C y pérdidas por humos.'}>
      <g class="bands">
        {#each S[o] as slot, i (i)}
          {@const g = geomOf(slot)}
          {@const b = slot[mode]}
          {@const op = opacityOf(slot)}
          <path d={bandPath(g, o)} class={`band c-${b.cls}`} class:hc={b.hc && t >= 1} class:on={info === b}
            style:opacity={op}
            role="button" tabindex={op > 0.5 ? 0 : -1} aria-label={`${b.label}: ${b.value}, ${b.pct} de la entrada`}
            onpointerenter={(e) => { if (e.pointerType === 'mouse') show(b); }} onpointerleave={(e) => { if (e.pointerType === 'mouse') hide(); }}
            onclick={() => pin(b)} onfocus={() => { info = b; }} onblur={hide}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin(b); } }} />
          {#if t >= 1 && op > 0.5 && Math.abs(g[2] - g[1]) > 2.2}
            <path d={bandCenter(g, o)} class="flow" style:--sw={Math.min(5, Math.max(1.6, (g[2] - g[1]) * 0.2)).toFixed(2)} style:--dur={`${(1.9 - Math.min(1.2, Math.log10(1 + b.v) / 3.6)).toFixed(2)}s`} aria-hidden="true" />
          {/if}
        {/each}
      </g>
      <g class="nodes" style:opacity={t >= 1 ? 1 : ease(t)}>
        {#each G.nodes as n, j (mode + j)}
          <rect x={n.x} y={n.y} width={Math.max(n.w, 1.5)} height={Math.max(n.h, 1.5)} class={`node c-${n.cls}`} />
          <text x={n.label.x} y={n.label.y} class="lbl" class:lhc={n.label.strong}>
            {#each n.label.lines as ln, i (i)}<tspan x={n.label.x} dy={i ? 16 : 0} class={i ? (n.label.sub ? 'sub' : 'val') : ''}>{ln}</tspan>{/each}
          </text>
        {/each}
      </g>
    </svg>
  {/each}

  <p class="sk-info" aria-live="polite">
    {#if info}
      <b>{info.label}</b> <span class="num">{info.value}</span> · <span class="num">{info.pct}</span> de la entrada
    {:else}
      <span class="sk-hint">Toca una banda para ver su valor y su peso sobre la entrada.</span>
    {/if}
  </p>
</div>

<style>
  .sk { display: grid; gap: 14px; }
  .sk-ctrl { display: flex; gap: 8px; flex-wrap: wrap; }
  .sk-ctrl .mono { font-size: 12px; opacity: .85; }
  .sk-svg { width: 100%; height: auto; }
  .sk-v { display: none; max-width: 420px; margin-inline: auto; }
  @media (max-width: 760px) { .sk-h { display: none; } .sk-v { display: block; } }
  .band { cursor: pointer; outline: none; fill-opacity: .5; stroke: none; transition: fill-opacity 160ms ease-out; }
  .band:hover, .band.on, .band:focus-visible { fill-opacity: .88; }
  .band:focus-visible { stroke: var(--char-ink); stroke-width: 1.5; }
  .band.hc { fill-opacity: .9; }
  .c-olive { fill: var(--olive-m); }
  .c-hc { fill: var(--olive-l); }
  .c-ion { fill: var(--ion); }
  .c-ochre { fill: var(--ochre-l); }
  .c-gray { fill: var(--char-muted); }
  .flow { fill: none; stroke: var(--char-ink); stroke-opacity: .55; stroke-width: var(--sw); stroke-linecap: round; stroke-dasharray: 0 22; animation: sk-flow var(--dur) linear infinite; pointer-events: none; }
  @keyframes sk-flow { to { stroke-dashoffset: -22; } }
  .node { stroke: none; }
  .lbl { font: 500 13.5px var(--f-sans); fill: var(--char-ink); }
  .val { fill: var(--char-muted); font-family: var(--f-mono); font-weight: 400; font-size: 12.5px; }
  .sub { fill: var(--char-muted); font-weight: 400; font-size: 12.5px; }
  .lhc { fill: var(--olive-l); font-weight: 600; font-size: 16px; }
  .sk-info { min-height: 2.9em; font-size: 15px; color: var(--char-ink); border-top: 1px solid var(--char-rule); padding-top: 10px; }
  .sk-info b { font-weight: 600; margin-right: 6px; }
  .sk-hint { color: var(--char-muted); }
  @media (prefers-reduced-motion: reduce) { .flow { display: none; } }
</style>
