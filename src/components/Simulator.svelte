<script lang="ts">
  /* Simulador financiero en vivo. Todo el cálculo es el modelo de la memoria (src/lib/model.ts),
     con las correcciones de BASE y la regla de ayudas de src/lib/sim.ts. */
  import { onMount } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { scaleLinear } from 'd3-scale';
  import { simulate, minPrice, overridesFromState, YEARS, type SimState } from '../lib/sim';
  import { num, signed, pct, THIN } from '../lib/format';
  import type { MCConfig, Tri } from '../lib/montecarlo';

  interface Slider { key: string; label: string; min?: number; max?: number; step?: number; unit?: string; nota?: string; options?: number[] }
  interface Preset { name: string; v: SimState }
  interface TRow { label: string; key: string; lo: number; hi: number; fmt: string }
  interface MCData {
    n: number;
    hoy: { price_hc: number[]; yield_hc: number[] };
    condicionado_al_hito_2: { price_hc: number[]; yield_hc: number[] };
    comunes: MCConfig['comunes'];
    resultados: { hoy: { p_pos: number }; condicionado: { p_pos: number } };
  }
  let { presets, sliders, tornado, mc, initial }: { presets: Preset[]; sliders: Slider[]; tornado: TRow[]; mc: MCData; initial: SimState } = $props();

  // ---------- estado ----------
  let st: SimState = $state({ ...initial });
  const r = $derived(simulate(overridesFromState(st)));
  const pmin = $derived(minPrice(overridesFromState(st)));
  const presetOn = $derived(presets.findIndex(p => (Object.keys(p.v) as (keyof SimState)[]).every(k => Math.abs(p.v[k] - st[k]) < 1e-9)));
  const S = Object.fromEntries(sliders.map(s => [s.key, s])) as Record<string, Slider>;

  // ---------- KPI con tween corto (200 ms); la primera vez ruedan desde cero ----------
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const opt = { duration: reduced ? 0 : 200, easing: cubicOut };
  const kNpv = new Tween(r.npv, opt), kIrr = new Tween(r.irr, opt), kPb = new Tween(r.pb, opt), kMin = new Tween(pmin, opt);
  const fcT = new Tween(r.fc.slice(), { duration: reduced ? 0 : 260, easing: cubicOut });
  let rolled = $state(false);
  $effect(() => {
    const v = { npv: r.npv, irr: r.irr, pb: r.pb, pmin, fc: r.fc.slice() };
    if (!rolled) return;
    kNpv.target = v.npv; kIrr.target = Number.isFinite(v.irr) ? v.irr : 0;
    if (Number.isFinite(v.pb)) kPb.target = v.pb;
    kMin.target = v.pmin; fcT.target = v.fc;
  });
  onMount(() => {
    // Lee el estado compartido de la URL: ?p=7&y=0.15&ms=21500&cx=1&b=150&a=0
    const q = new URLSearchParams(location.search);
    const rd = (k: string, s: Slider | undefined, fallback: number) => {
      const v = Number(q.get(k));
      if (!q.has(k) || !Number.isFinite(v)) return fallback;
      if (s?.options) return s.options.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
      return Math.min(s?.max ?? v, Math.max(s?.min ?? v, v));
    };
    st = { price_hc: rd('p', S.price_hc, st.price_hc), yield_hc: rd('y', S.yield_hc, st.yield_hc), ms: rd('ms', S.ms, st.ms),
      capex_f: rd('cx', S.capex_f, st.capex_f), p_bone: rd('b', S.p_bone, st.p_bone), aid_ier: rd('a', S.aid_ier, st.aid_ier) };
    const go = () => {
      rolled = true;
      if (reduced) { kNpv.set(r.npv, { duration: 0 }); return; }
      kNpv.set(0, { duration: 0 }); kIrr.set(0, { duration: 0 }); kMin.set(0, { duration: 0 });
      const roll = { duration: 900, easing: cubicOut };
      kNpv.set(r.npv, roll); kIrr.set(Number.isFinite(r.irr) ? r.irr : 0, roll); kMin.set(pmin, roll);
      if (Number.isFinite(r.pb)) { kPb.set(0, { duration: 0 }); kPb.set(r.pb, roll); }
      fcT.set(r.fc.slice(), { duration: 0 });
    };
    go();
  });

  // ---------- URL compartible ----------
  let urlT = 0;
  const query = () => `?p=${st.price_hc}&y=${st.yield_hc}&ms=${st.ms}&cx=${st.capex_f}&b=${st.p_bone}&a=${st.aid_ier}`;
  function touchUrl() {
    clearTimeout(urlT);
    urlT = window.setTimeout(() => history.replaceState(null, '', location.pathname + query() + '#simulador'), 350);
  }
  let copied = $state(false);
  async function copyLink() {
    const url = location.origin + location.pathname + query() + '#simulador';
    try { await navigator.clipboard.writeText(url); } catch { window.prompt('Copia este enlace', url); }
    copied = true; setTimeout(() => (copied = false), 2200);
  }
  function setPreset(i: number) { st = { ...presets[i].v }; touchUrl(); }
  function setKey(k: keyof SimState, v: number) { st = { ...st, [k]: v }; touchUrl(); }

  // ---------- veredicto ----------
  const verdict = $derived(r.npv > 2
    ? { cls: 'good', t: 'Crea valor', s: 'VAN, TIR y plazo de recuperación favorables a la vez.' }
    : r.npv > -2
      ? { cls: 'mid', t: 'En el umbral', s: 'La rentabilidad iguala la tasa exigida: cualquier desviación decide.' }
      : { cls: 'bad', t: 'Destruye valor', s: 'Con estas condiciones no recomendaríamos invertir en la planta.' });

  // ---------- gráfico de flujo de caja ----------
  let cw = $state(720);
  const ch = $derived(cw < 520 ? 250 : 300);
  const M = { l: 44, r: 12, t: 22, b: 30 };
  const cum = $derived(fcT.current.reduce<number[]>((a, v, i) => (a.push((i ? a[i - 1] : 0) + v), a), []));
  const yS = $derived.by(() => {
    const lo = Math.min(0, ...fcT.current, ...cum), hi = Math.max(0, ...fcT.current, ...cum);
    return scaleLinear().domain([lo, hi]).nice(6).range([ch - M.b, M.t]);
  });
  const bw = $derived((cw - M.l - M.r) / YEARS.length);
  const xb = (i: number) => M.l + i * bw;
  const pbX = $derived.by(() => {
    // cruce del acumulado por cero: x dentro del año en que se recupera
    const c = r.cum, f = r.fc;
    for (let i = 1; i < c.length; i++) if (YEARS[i] > r.start && c[i - 1] < 0 && c[i] >= 0) return xb(i) + (-c[i - 1] / f[i]) * bw;
    return null;
  });
  const minI = $derived(r.cum.indexOf(Math.min(...r.cum)));
  const ticksX = $derived(cw < 520 ? [2027, 2032, 2042, 2051] : [2027, 2032, 2037, 2042, 2047, 2051]);

  // ---------- tornado en vivo ----------
  interface TRes { label: string; lo: number; hi: number; vlo: string; vhi: string; span: number }
  let trows: TRes[] = $state([]);
  let tT = 0;
  const fmtT = (fmt: string, v: number, key: string) => {
    if (fmt === 'x') return '×' + num(v, 2);
    if (fmt === 'pct0') return pct(v, 0);
    if (fmt === 'pct') return pct(v, 0);
    if (fmt === 'staff') return (v > 47008.35 ? '+' : '−') + '15' + THIN + '%';
    if (key === 'delay') return num(v) + THIN + (v === 1 ? 'año' : 'años');
    const d = /\{:\.(\d)f\}/.exec(fmt); return num(v, d ? Number(d[1]) : 0);
  };
  function runTornado() {
    const base = overridesFromState(st);
    trows = tornado.map(row => {
      const lo = simulate({ ...base, [row.key]: row.lo }).npv, hi = simulate({ ...base, [row.key]: row.hi }).npv;
      return { label: row.label, lo, hi, vlo: fmtT(row.fmt, row.lo, row.key), vhi: fmtT(row.fmt, row.hi, row.key), span: Math.abs(hi - lo) };
    }).sort((a, b) => b.span - a.span);
  }
  $effect(() => { void r; clearTimeout(tT); tT = window.setTimeout(runTornado, 120); });
  let tw = $state(640);
  const tX = $derived.by(() => {
    const vals = trows.flatMap(t => [t.lo, t.hi]).concat(r.npv);
    const lo = Math.min(...vals, -5), hi = Math.max(...vals, 5);
    const lw = tw < 520 ? 0 : 230;
    return { s: scaleLinear().domain([lo, hi]).nice().range([lw + 8, tw - 12]), lw };
  });

  // ---------- Monte Carlo (Web Worker, bajo demanda) ----------
  type MCMode = 'hoy' | 'cond';
  let mcMode: MCMode = $state('hoy');
  let mcVals: number[] = $state([]);
  let mcRun = $state(false);
  let worker: Worker | null = null;
  const BIN = 2.5, LO = -55, HI = 45;
  const bins = $derived.by(() => {
    const b = new Array(Math.round((HI - LO) / BIN)).fill(0);
    for (const v of mcVals) { const k = Math.min(b.length - 1, Math.max(0, Math.floor((v - LO) / BIN))); b[k]++; }
    return b;
  });
  const pPos = $derived(mcVals.length ? mcVals.filter(v => v > 0).length / mcVals.length : NaN);
  const memo = $derived(mcMode === 'hoy' ? mc.resultados.hoy.p_pos : mc.resultados.condicionado.p_pos);
  function launch() {
    worker?.terminate();
    mcVals = []; mcRun = true;
    worker = new Worker(new URL('../workers/montecarlo.worker.ts', import.meta.url), { type: 'module' });
    const m = mcMode === 'hoy' ? mc.hoy : mc.condicionado_al_hito_2;
    const cfg: MCConfig = { modo: { price_hc: m.price_hc as Tri, yield_hc: m.yield_hc as Tri }, comunes: mc.comunes };
    worker.onmessage = (e: MessageEvent<{ values: number[]; done: boolean }>) => {
      mcVals = mcVals.concat(e.data.values);
      if (e.data.done) { mcRun = false; worker?.terminate(); worker = null; }
    };
    // semillas 7 (hoy) y 8 (condicionado), como en la memoria
    worker.postMessage({ n: mc.n, seed: mcMode === 'hoy' ? 7 : 8, cfg });
  }
  function setMc(m: MCMode) { if (m !== mcMode) { mcMode = m; worker?.terminate(); worker = null; mcRun = false; mcVals = []; } }
  let hw = $state(640);
  const hMax = $derived(Math.max(1, ...bins));
  const hx = $derived(scaleLinear().domain([LO, HI]).range([36, hw - 10]));

  let tab: 'tornado' | 'mc' = $state('tornado');

  // ---------- presentación ----------
  const fill = (k: keyof SimState) => { const s = S[k]; return s.min !== undefined && s.max !== undefined ? ((st[k] - s.min) / (s.max - s.min)) * 100 : 0; };
  const pminPos = $derived(Math.min(100, Math.max(0, ((pmin - S.price_hc.min!) / (S.price_hc.max! - S.price_hc.min!)) * 100)));
</script>

<div class="sim" data-ready={rolled}>
  <!-- barra fija del móvil con VAN y TIR -->
  <div class="sim-sticky" aria-hidden="true">
    <span>VAN <b class:neg={r.npv < 0}>{signed(kNpv.current, 1)}{THIN}M€</b></span>
    <span>TIR <b>{Number.isFinite(r.irr) ? pct(kIrr.current, 1) : '—'}</b></span>
    <span class={`pill ${verdict.cls}`}>{verdict.t}</span>
  </div>

  <div class="sim-grid">
    <form class="ctrl" onsubmit={(e) => e.preventDefault()} aria-label="Parámetros del simulador">
      <fieldset class="presets">
        <legend class="mono">Escenarios</legend>
        {#each presets as p, i (p.name)}
          <button type="button" class="btn btn--line" aria-pressed={presetOn === i} onclick={() => setPreset(i)}>{p.name}</button>
        {/each}
      </fieldset>

      {#each sliders.filter(s => !s.options) as s (s.key)}
        {@const k = s.key as keyof SimState}
        <div class="sl">
          <label for={`sl-${s.key}`}>
            <span>{#if s.key === 'price_hc'}Precio del <em>hard carbon</em>{:else}{s.label}{/if}</span>
            <output for={`sl-${s.key}`} class="num">
              {#if k === 'price_hc'}{num(st[k], 2)}{THIN}€/kg
              {:else if k === 'ms'}{num(st[k])}{THIN}t/año
              {:else if k === 'capex_f'}{st[k] === 1 ? '±0' : (st[k] > 1 ? '+' : '−') + num(Math.abs(st[k] - 1) * 100)}{THIN}% · ×{num(st[k], 2)}
              {:else if k === 'p_bone'}{num(st[k])}{THIN}€/t
              {:else if k === 'yield_hc'}{num(st[k] * 100, 1)}{THIN}%{/if}
            </output>
          </label>
          <div class="rail" style:--f={`${fill(k)}%`}>
            <input id={`sl-${s.key}`} type="range" min={s.min} max={s.max} step={s.step} value={st[k]}
              oninput={(e) => setKey(k, Number((e.currentTarget as HTMLInputElement).value))}
              aria-valuetext={k === 'price_hc' ? `${num(st[k], 2)} euros por kilo` : undefined} />
            {#if k === 'price_hc'}
              <span class="mark" style:left={`${pminPos}%`} aria-hidden="true"><i></i><span class="mono">mín. {num(pmin, 2)}</span></span>
            {/if}
          </div>
          {#if k === 'price_hc'}<small>{s.nota} · la marca es el precio mínimo para VAN = 0</small>
          {:else if k === 'ms'}<small>≈{THIN}{num(r.b.hc)}{THIN}t/año de <em>hard carbon</em> y {num(st.ms / 0.89)}{THIN}t de hueso comprado (ms / 0,89). Diseño: 21.500{THIN}t.</small>
          {:else if k === 'capex_f'}<small>Inversión total en planta: {num(r.capex, 1)}{THIN}M€ (precisión de estudios previos: ±{THIN}30{THIN}%)</small>
          {:else if s.nota}<small>{s.nota}</small>{/if}
        </div>
      {/each}

      <fieldset class="aid">
        <legend>Ayuda regional a la inversión <output class="num">{st.aid_ier ? pct(st.aid_ier, 0) : 'ninguna'}</output></legend>
        <div class="aid-b">
          {#each S.aid_ier.options ?? [] as v (v)}
            <button type="button" class="btn btn--line" aria-pressed={st.aid_ier === v} onclick={() => setKey('aid_ier', v)}>{v ? pct(v, 0) : 'Sin ayuda'}</button>
          {/each}
        </div>
        <small>Con ayuda, la Fase 1 recibe además el 40{THIN}% del equipo de ensayo.</small>
      </fieldset>

      <button type="button" class="btn btn--ink share" onclick={copyLink}>{copied ? 'Enlace copiado' : 'Copiar enlace a este escenario'}</button>
    </form>

    <div class="res">
      <dl class="kpis">
        <div><dt>VAN real al 8{THIN}%</dt><dd class:neg={r.npv < 0} class:pos={r.npv >= 0}><span class="num">{signed(kNpv.current, 1)}</span><small>{THIN}M€</small></dd></div>
        <div><dt>TIR real del proyecto</dt><dd><span class="num">{Number.isFinite(r.irr) ? pct(kIrr.current, 1) : '—'}</span></dd></div>
        <div><dt>Recuperación desde el arranque</dt><dd>{#if Number.isFinite(r.pb)}<span class="num">{num(kPb.current, 1)}</span><small>{THIN}años</small>{:else}<span class="nr">no recupera</span>{/if}</dd></div>
        <div><dt>Precio mínimo para VAN = 0</dt><dd><span class="num">{num(kMin.current, 2)}</span><small>{THIN}€/kg</small></dd></div>
      </dl>
      <p class="verdict" aria-live="polite"><span class={`pill ${verdict.cls}`}>{verdict.t}</span><span>{verdict.s}</span></p>

      <figure class="fc" bind:clientWidth={cw}>
        <svg viewBox={`0 0 ${cw} ${ch}`} role="img" aria-label={`Flujo de caja anual de 2027 a 2051 y acumulado. Exposición máxima ${num(r.minCash, 1)} M€ en ${YEARS[minI]}.${Number.isFinite(r.pb) ? ` Recupera la inversión ${num(r.pb, 1)} años después del arranque.` : ' No recupera la inversión.'}`}>
          {#each yS.ticks(6) as tk (tk)}
            <line x1={M.l} x2={cw - M.r} y1={yS(tk)} y2={yS(tk)} class={tk === 0 ? 'zero' : 'gl'} />
            <text x={M.l - 6} y={yS(tk) + 4} class="ax" text-anchor="end">{num(tk)}</text>
          {/each}
          {#each fcT.current as v, i (i)}
            <rect x={xb(i) + bw * 0.16} width={bw * 0.68} y={Math.min(yS(v), yS(0))} height={Math.max(1, Math.abs(yS(v) - yS(0)))} class={v < 0 ? 'b-neg' : 'b-pos'} />
          {/each}
          <polyline points={cum.map((v, i) => `${xb(i) + bw},${yS(v)}`).join(' ')} class="cum" />
          <!-- exposición máxima -->
          <circle cx={xb(minI) + bw} cy={yS(r.cum[minI])} r="4.5" class="mk-min" />
          <text x={xb(minI) + bw + 8} y={yS(r.cum[minI]) + 4} class="ann">exposición máx. {num(r.minCash, 1)}{THIN}M€</text>
          {#if pbX !== null}
            <line x1={pbX} x2={pbX} y1={M.t} y2={ch - M.b} class="mk-pb" />
            <text x={pbX - 6} y={M.t + 10} class="ann" text-anchor="end">recupera · {num(r.pb, 1)}{THIN}años</text>
          {/if}
          {#each ticksX as y (y)}
            <text x={xb(y - 2027) + bw / 2} y={ch - 10} class="ax" text-anchor="middle">{y}</text>
          {/each}
          <text x={M.l} y="12" class="ax">{cw < 520 ? 'M€ de 2026' : 'M€ de 2026 · barras: flujo anual · línea: acumulado'}</text>
        </svg>
        <figcaption class="fc-leg"><span><i class="lg-pos"></i>flujo anual positivo</span><span><i class="lg-neg"></i>negativo</span><span><i class="lg-cum"></i>acumulado</span></figcaption>
      </figure>

      <dl class="mini">
        <div><dt>Inversión total en planta</dt><dd class="num">{num(r.capex, 1)}{THIN}M€</dd></div>
        <div><dt>Ventas en un año tipo (2037)</dt><dd class="num">{num(r.sales37, 1)}{THIN}M€</dd></div>
        <div><dt>EBITDA en un año tipo</dt><dd class="num">{num(r.ebitda37, 1)}{THIN}M€</dd></div>
      </dl>
  <div class="tabs sim-tabs" role="tablist" aria-label="Análisis de sensibilidad">
        <button type="button" role="tab" id="tab-tor" aria-controls="pan-tor" aria-selected={tab === 'tornado'} tabindex={tab === 'tornado' ? 0 : -1} onclick={() => (tab = 'tornado')}>Tornado</button>
        <button type="button" role="tab" id="tab-mc" aria-controls="pan-mc" aria-selected={tab === 'mc'} tabindex={tab === 'mc' ? 0 : -1} onclick={() => (tab = 'mc')}>Monte Carlo</button>
      </div>
      <div class="sens">
        <section class="tor" id="pan-tor" role="tabpanel" aria-labelledby="tab-tor" class:on={tab === 'tornado'}>
          <h3>Qué mueve el VAN alrededor de este punto</h3>
          <p class="sub">Once parámetros entre sus valores bajo y alto (memoria, anexo C). La línea es el VAN actual: {signed(r.npv, 1)}{THIN}M€.</p>
          <div class="tor-w" bind:clientWidth={tw}>
            {#if tX.lw === 0}
              <ol class="tor-m" role="list">
                {#each trows as t (t.label)}
                  <li>
                    <span class="tl">{t.label}</span>
                    <svg viewBox={`0 0 ${tw} 26`} aria-hidden="true">
                      <line x1={tX.s(r.npv)} x2={tX.s(r.npv)} y1="0" y2="26" class="base" />
                      <rect x={Math.min(tX.s(t.lo), tX.s(r.npv))} width={Math.abs(tX.s(t.lo) - tX.s(r.npv))} y="5" height="16" class={t.lo < r.npv ? 'b-neg' : 'b-pos'} />
                      <rect x={Math.min(tX.s(t.hi), tX.s(r.npv))} width={Math.abs(tX.s(t.hi) - tX.s(r.npv))} y="5" height="16" class={t.hi < r.npv ? 'b-neg' : 'b-pos'} />
                    </svg>
                    <span class="tv mono">{t.vlo}: {signed(t.lo, 1)} · {t.vhi}: {signed(t.hi, 1)}</span>
                  </li>
                {/each}
              </ol>
            {:else}
              <svg viewBox={`0 0 ${tw} ${trows.length * 30 + 30}`} role="img" aria-label="Diagrama de tornado del VAN">
                {#each tX.s.ticks(6) as tk (tk)}
                  <line x1={tX.s(tk)} x2={tX.s(tk)} y1="0" y2={trows.length * 30 + 4} class="gl" />
                  <text x={tX.s(tk)} y={trows.length * 30 + 20} class="ax" text-anchor="middle">{num(tk)}</text>
                {/each}
                {#each trows as t, i (t.label)}
                  <text x="0" y={i * 30 + 19} class="tlab">{t.label}</text>
                  <rect x={Math.min(tX.s(t.lo), tX.s(r.npv))} width={Math.abs(tX.s(t.lo) - tX.s(r.npv))} y={i * 30 + 6} height="18" class={t.lo < r.npv ? 'b-neg' : 'b-pos'} />
                  <rect x={Math.min(tX.s(t.hi), tX.s(r.npv))} width={Math.abs(tX.s(t.hi) - tX.s(r.npv))} y={i * 30 + 6} height="18" class={t.hi < r.npv ? 'b-neg' : 'b-pos'} />
                  <text x={Math.min(tX.s(t.lo), tX.s(t.hi)) - 5} y={i * 30 + 19} class="tval" text-anchor="end">{t.lo < t.hi ? t.vlo : t.vhi}</text>
                  <text x={Math.max(tX.s(t.lo), tX.s(t.hi)) + 5} y={i * 30 + 19} class="tval">{t.lo < t.hi ? t.vhi : t.vlo}</text>
                {/each}
                <line x1={tX.s(r.npv)} x2={tX.s(r.npv)} y1="0" y2={trows.length * 30 + 4} class="base" />
              </svg>
            {/if}
          </div>
        </section>

        <section class="mc" id="pan-mc" role="tabpanel" aria-labelledby="tab-mc" class:on={tab === 'mc'}>
          <h3>¿Con qué probabilidad el VAN es positivo?</h3>
          <p class="sub">4.000 escenarios con las distribuciones triangulares de la memoria (precio, rendimiento, inversión, hueso, electricidad, ayuda y retraso).</p>
          <div class="mc-ctrl">
            <div class="seg" role="group" aria-label="Distribución">
              <button type="button" class="btn btn--line" aria-pressed={mcMode === 'hoy'} onclick={() => setMc('hoy')}>Hoy</button>
              <button type="button" class="btn btn--line" aria-pressed={mcMode === 'cond'} onclick={() => setMc('cond')}>Condicionado al Hito 2</button>
            </div>
            <button type="button" class="btn btn--ink" onclick={launch} disabled={mcRun}>{mcRun ? 'Simulando…' : `Lanzar ${num(mc.n)} simulaciones`}</button>
          </div>
          <div class="mc-out" bind:clientWidth={hw}>
            <p class="mc-p" aria-live="polite">
              {#if mcVals.length}
                <b class="num">{pct(pPos, 1)}</b> de VAN positivo · <span class="num">{num(mcVals.length)}</span> de {num(mc.n)} · la memoria da {pct(memo, 1)}
              {:else}
                <span class="sub">Pulsa el botón: el histograma se llena en vivo. La memoria da {pct(memo, 1)}.</span>
              {/if}
            </p>
            <svg viewBox={`0 0 ${hw} 190`} role="img" aria-label={mcVals.length ? `Histograma del VAN en ${num(mcVals.length)} escenarios: ${pct(pPos, 1)} con VAN positivo.` : 'Histograma vacío'}>
              {#each bins as c, i (i)}
                {@const x0 = hx(LO + i * BIN)}
                <rect x={x0 + 0.5} width={Math.max(1, hx(LO + (i + 1) * BIN) - x0 - 1)} y={160 - (c / hMax) * 140} height={(c / hMax) * 140} class={LO + i * BIN < 0 ? 'b-neg' : 'b-pos'} />
              {/each}
              <line x1={hx(0)} x2={hx(0)} y1="10" y2="160" class="base" />
              <line x1="36" x2={hw - 10} y1="160" y2="160" class="zero" />
              {#each [-50, -25, 0, 25] as tk (tk)}
                <text x={hx(tk)} y="178" class="ax" text-anchor="middle">{num(tk)}</text>
              {/each}
              <text x={hw - 10} y="178" class="ax" text-anchor="end">VAN, M€</text>
            </svg>
          </div>
        </section>
      </div>
    </div>
  </div>

</div>

<style>
  .sim { position: relative; }
  .sim-sticky {
    display: none; position: sticky; top: var(--header-h); z-index: 30;
    margin: 0 calc(-1 * var(--side)) 16px; padding: 10px var(--side);
    background: var(--char); color: var(--char-ink); font-size: 14px;
    align-items: center; gap: 16px;
  }
  .sim-sticky b { font: 600 18px var(--f-serif); font-variant-numeric: tabular-nums; margin-left: 4px; color: var(--olive-l); }
  .sim-sticky b.neg { color: var(--terra-l); }
  .sim-sticky .pill { margin-left: auto; }
  .sim-grid { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: var(--gutter); align-items: start; }
  .ctrl { display: grid; gap: 22px; background: var(--surface); border: 1px solid var(--rule); padding: 22px; position: sticky; top: calc(var(--header-h) + 16px); }
  fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
  .presets { display: flex; flex-wrap: wrap; gap: 6px; }
  .presets legend, .aid legend { font: 500 12px var(--f-mono); color: var(--muted); margin-bottom: 8px; padding: 0; }
  .aid legend { display: flex; justify-content: space-between; width: 100%; font: 500 15px var(--f-sans); color: var(--ink); }
  .presets .btn { min-height: 40px; padding: 0 12px; font-size: 14px; font-weight: 500; }
  .sl { display: grid; gap: 4px; }
  .sl label { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-weight: 500; font-size: 15px; }
  .sl output, .aid output { font: 500 14px var(--f-mono); color: var(--olive-d); white-space: nowrap; }
  .sl small, .aid small { color: var(--muted); font-size: 13px; line-height: 1.4; }
  .rail { position: relative; height: 44px; display: flex; align-items: center; }
  input[type='range'] {
    -webkit-appearance: none; appearance: none; width: 100%; height: 44px; margin: 0; background: transparent; cursor: pointer;
  }
  input[type='range']::-webkit-slider-runnable-track { height: 4px; background: linear-gradient(90deg, var(--ink) var(--f), var(--rule) var(--f)); }
  input[type='range']::-moz-range-track { height: 4px; background: var(--rule); }
  input[type='range']::-moz-range-progress { height: 4px; background: var(--ink); }
  input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; margin-top: -9px; border-radius: 50%; background: var(--ink); border: 3px solid var(--surface); box-shadow: 0 0 0 1px var(--ink); }
  input[type='range']::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: var(--ink); border: 3px solid var(--surface); box-shadow: 0 0 0 1px var(--ink); }
  input[type='range']:focus-visible { outline: none; }
  input[type='range']:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px var(--ion-d); }
  input[type='range']:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 3px var(--ion-d); }
  .mark { position: absolute; top: 4px; transform: translateX(-50%); pointer-events: none; display: grid; justify-items: center; transition: left 160ms ease-out; }
  .mark i { width: 2px; height: 12px; background: var(--terra); }
  .mark .mono { position: absolute; top: 30px; font-size: 11.5px; color: var(--terra); white-space: nowrap; }
  .aid-b { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
  .aid-b .btn { padding: 0 6px; font-size: 14px; }
  .share { justify-self: start; }

  .res { display: grid; gap: 16px; }
  .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; background: var(--surface); border: 1px solid var(--rule); }
  .kpis div { padding: 16px 16px 14px; }
  .kpis div + div { border-left: 1px solid var(--rule); }
  .kpis dt { font-size: 13px; color: var(--muted); line-height: 1.3; }
  .kpis dd { margin: 6px 0 0; font: 600 clamp(26px, 2.6vw, 36px)/1.05 var(--f-serif); font-variant-numeric: tabular-nums; font-variation-settings: 'opsz' 48; }
  .kpis dd small { font: 500 14px var(--f-sans); color: var(--muted); }
  .kpis dd.pos { color: var(--olive); } .kpis dd.neg { color: var(--terra); }
  .kpis .nr { font-size: .7em; }
  .verdict { display: flex; align-items: center; gap: 12px; font-size: 15.5px; }
  .pill { font: 600 12.5px/1 var(--f-sans); padding: 6px 9px; border-radius: 2px; white-space: nowrap; }
  .pill.good { background: var(--olive-p); color: var(--olive-d); }
  .pill.mid { background: var(--ochre-p); color: var(--ink); }
  .pill.bad { background: var(--terra-p); color: var(--ink); }
  .fc { background: var(--surface); border: 1px solid var(--rule); padding: 8px 6px 4px; }
  .fc svg { width: 100%; height: auto; display: block; }
  .ax { font: 500 11.5px var(--f-mono); fill: var(--muted); }
  .gl { stroke: var(--rule-2); stroke-width: 1; }
  .zero { stroke: var(--ink); stroke-width: 1; }
  .b-pos { fill: var(--olive); } .b-neg { fill: var(--terra); }
  .cum { fill: none; stroke: var(--ion-d); stroke-width: 2.4; stroke-linejoin: round; }
  .mk-min { fill: var(--surface); stroke: var(--terra); stroke-width: 2; }
  .mk-pb { stroke: var(--ion-d); stroke-width: 1.4; stroke-dasharray: 4 3; }
  .ann { font: 500 12px var(--f-sans); fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: 3px; }
  .mini { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 0; }
  .mini div { border-top: 2px solid var(--ink); padding-top: 8px; }
  .mini dt { font-size: 13px; color: var(--muted); }
  .mini dd { margin: 2px 0 0; font: 600 22px var(--f-serif); }

  .sim-tabs { display: none; margin-top: 32px; }
  .sens { display: grid; gap: 36px; margin-top: 24px; }
  .fc-leg { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12.5px; color: var(--muted); padding: 4px 8px 6px; }
  .fc-leg i { display: inline-block; width: 12px; height: 10px; margin-right: 6px; vertical-align: -1px; }
  .lg-pos { background: var(--olive); } .lg-neg { background: var(--terra); } .lg-cum { height: 0 !important; border-top: 2.4px solid var(--ion-d); vertical-align: 3px !important; }
  .sens h3 { font-size: clamp(20px, 1.8vw, 24px); margin-bottom: 6px; }
  .sens .sub { font-size: 14px; color: var(--muted); margin-bottom: 14px; }
  .tor-w, .mc-out { background: var(--surface); border: 1px solid var(--rule); padding: 14px 12px 8px; }
  .tor-w svg, .mc-out svg { width: 100%; height: auto; display: block; }
  .tlab { font: 500 12.5px var(--f-sans); fill: var(--ink); }
  .tval { font: 500 11.5px var(--f-mono); fill: var(--muted); }
  .base { stroke: var(--ink); stroke-width: 1.6; }
  .tor-m { display: grid; gap: 10px; margin: 0; }
  .tor-m li { display: grid; gap: 2px; }
  .tor-m .tl { font-size: 13.5px; font-weight: 500; }
  .tor-m .tv { font-size: 12px; color: var(--muted); }
  .mc-ctrl { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; align-items: center; justify-content: space-between; }
  .seg { display: flex; gap: 6px; flex-wrap: wrap; }
  .seg .btn { font-size: 14px; padding: 0 12px; }
  .mc-p { font-size: 15px; margin-bottom: 8px; min-height: 1.6em; }
  .mc-p b { font: 600 24px var(--f-serif); color: var(--olive-d); }

  @media (max-width: 1000px) {
    .sim-grid { grid-template-columns: minmax(0, 1fr); }
    .ctrl { position: static; }
  }
  @media (max-width: 900px) {
    .sim-sticky { display: flex; }
    .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .kpis div:nth-child(3) { border-left: 0; }
    .kpis div:nth-child(n + 3) { border-top: 1px solid var(--rule); }
    .sim-tabs { display: flex; }
    .sens { margin-top: 16px; }
    .sens section:not(.on) { display: none; }
    .mini { grid-template-columns: minmax(0, 1fr); gap: 8px; }
    .mini div { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .ctrl { padding: 18px 16px; }
  }
</style>
