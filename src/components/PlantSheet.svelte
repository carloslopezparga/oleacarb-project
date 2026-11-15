<script lang="ts">
  /* Ficha de un edificio de la planta. En escritorio es una tarjeta al lado del plano;
     en el móvil, una hoja inferior arrastrable. La abren el plano 2D y la maqueta 3D con el evento plant:select. */
  interface Zone {
    id: string; name: string; cat: string; text: string; area: string | null; dims: string; height: string;
    equipment: [string, string][];
  }
  let { zones, initial = 'N4' }: { zones: Zone[]; initial?: string } = $props();

  let sel = $state(initial);
  let open = $state(false);
  let dragY = $state(0);
  let dragging = false;
  let y0 = 0;
  let panel: HTMLElement | undefined = $state();
  let closeBtn: HTMLButtonElement | undefined = $state();
  const zone = $derived(zones.find(z => z.id === sel) ?? zones[0]);
  const isMobile = () => typeof matchMedia !== 'undefined' && matchMedia('(max-width: 900px)').matches;

  $effect(() => {
    const onSel = (e: Event) => {
      const { id, quiet } = (e as CustomEvent<{ id: string; quiet?: boolean }>).detail;
      if (!zones.some(z => z.id === id)) return;
      sel = id;
      if (isMobile() && !quiet) {
        open = true;
        window.dispatchEvent(new CustomEvent('sheet:open', { detail: panel }));
        queueMicrotask(() => closeBtn?.focus({ preventScroll: true }));
      }
    };
    const onClose = () => { open = false; };
    const onOther = (e: Event) => { if ((e as CustomEvent<HTMLElement>).detail !== panel) open = false; };
    window.addEventListener('plant:select', onSel);
    window.addEventListener('plant:close', onClose);
    window.addEventListener('sheet:open', onOther);
    return () => { window.removeEventListener('plant:select', onSel); window.removeEventListener('plant:close', onClose); window.removeEventListener('sheet:open', onOther); };
  });

  function close() {
    open = false;
    window.dispatchEvent(new CustomEvent('plant:closed'));
  }
  function down(e: PointerEvent) {
    if ((e.target as Element).closest('button')) return;
    dragging = true; y0 = e.clientY; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) { if (dragging) dragY = Math.max(0, e.clientY - y0); }
  function up() { if (!dragging) return; dragging = false; if (dragY > 80) close(); dragY = 0; }
</script>

<aside class="pficha" class:is-open={open} bind:this={panel} aria-live="polite"
  style:transform={dragY ? `translateY(${dragY}px)` : undefined}
  onkeydown={(e) => { if (e.key === 'Escape' && open) close(); }}>
  <div class="grab" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
    <span class="pf-tag mono">{zone.id} · {zone.cat}</span>
    <button type="button" class="ibtn pf-close" aria-label="Cerrar la ficha" bind:this={closeBtn} onclick={close}>×</button>
  </div>
  <h3>{zone.name}</h3>
  <dl class="pf-kv">
    {#if zone.area}<dt>Superficie</dt><dd>{zone.area}</dd>{/if}
    <dt>Dimensiones</dt><dd>{zone.dims}</dd>
    <dt>Altura</dt><dd>{zone.height}</dd>
  </dl>
  <p class="pf-text">{zone.text}</p>
  {#if zone.equipment.length}
    <ul class="pf-eq" role="list">
      {#each zone.equipment.slice(0, 6) as [tag, desc] (tag)}
        <li><b class="mono">{tag}</b><span>{desc}</span></li>
      {/each}
    </ul>
  {/if}
</aside>

<style>
  .pficha {
    background: var(--surface); border: 1px solid var(--rule); padding: 20px 22px 22px;
    display: grid; gap: 12px; align-content: start;
  }
  .grab { display: flex; justify-content: space-between; align-items: center; min-height: 32px; }
  .pf-tag { font-size: 12.5px; color: var(--ink); background: var(--rule-2); padding: 3px 7px; border-radius: 2px; }
  .pf-close { display: none; }
  h3 { font-size: clamp(22px, 2vw, 28px); }
  .pf-kv { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 16px; margin: 0; font-size: 14.5px; border-top: 1px solid var(--rule); padding-top: 10px; }
  .pf-kv dt { color: var(--muted); }
  .pf-kv dd { margin: 0; font-variant-numeric: tabular-nums; font-weight: 500; }
  .pf-text { font-size: 15px; color: var(--ink); }
  .pf-eq { display: grid; margin: 0; padding: 0; list-style: none; }
  .pf-eq li { display: grid; gap: 2px; padding: 9px 0; border-top: 1px solid var(--rule-2); font-size: 13.5px; color: var(--muted); }
  .pf-eq b { font-size: 12.5px; font-weight: 500; color: var(--olive-d); }

  @media (max-width: 900px) {
    .pficha {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 95; max-height: 76svh; overflow: auto; overscroll-behavior: contain;
      border: 0; border-top: 1px solid var(--rule); box-shadow: 0 -12px 40px rgba(21, 25, 26, .22);
      padding: 0 20px calc(22px + env(safe-area-inset-bottom, 0px));
      transform: translateY(105%); visibility: hidden;
      transition: transform var(--t-mid) var(--ease-out), visibility var(--t-mid);
    }
    .pficha.is-open { transform: translateY(0); visibility: visible; }
    .grab { position: sticky; top: 0; background: var(--surface); padding: 14px 0 6px; touch-action: none; z-index: 1; }
    .grab::before { content: ""; position: absolute; left: 50%; top: 6px; width: 40px; height: 4px; margin-left: -20px; border-radius: 2px; background: var(--rule); }
    .pf-close { display: inline-grid; }
  }
</style>
