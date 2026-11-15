<script lang="ts">
  /* Reproductor del vídeo con controles en la identidad. Detrás va el <video> nativo.
     720p en pantallas de menos de 1.000 px o con ahorro de datos; 1080p en el resto, si el archivo existe (HEAD). */
  import { onMount } from 'svelte';
  let { sd, hd, poster, label, duration = 79 }: { sd: string; hd: string; poster: string; label: string; duration?: number } = $props();

  let video: HTMLVideoElement | undefined = $state();
  let wrap: HTMLDivElement | undefined = $state();
  let ready = $state(false);
  let playing = $state(false);
  let muted = $state(false);
  let t = $state(0);
  let dur = $state(duration);
  let started = $state(false);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  onMount(async () => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    let src = sd;
    if (window.innerWidth >= 1000 && !conn?.saveData) {
      try { const res = await fetch(hd, { method: 'HEAD' }); if (res.ok) src = hd; } catch { /* sin 1080p: se queda el de 720p */ }
    }
    if (video) { video.src = src; video.controls = false; ready = true; }
  });

  function toggle() {
    if (!video) return;
    started = true;
    if (video.paused) video.play(); else video.pause();
  }
  function seek(e: Event) { if (video) video.currentTime = Number((e.currentTarget as HTMLInputElement).value); }
  function mute() { if (video) { video.muted = !video.muted; muted = video.muted; } }
  function full() {
    const v = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (wrap?.requestFullscreen) wrap.requestFullscreen().catch(() => v.webkitEnterFullscreen?.());
    else v.webkitEnterFullscreen?.();
  }
</script>

<div class="vp" class:is-ready={ready} class:is-playing={playing} bind:this={wrap}>
  <!-- svelte-ignore a11y_media_has_caption -->
  <video bind:this={video} {poster} preload="metadata" playsinline controls aria-label={label}
    onplay={() => (playing = true)} onpause={() => (playing = false)} onended={() => (playing = false)}
    ontimeupdate={() => (t = video?.currentTime ?? 0)} onloadedmetadata={() => (dur = video?.duration || duration)}
    onclick={() => ready && toggle()}></video>
  {#if ready && !started}
    <button type="button" class="vp-big" onclick={toggle} aria-label="Reproducir el vídeo">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><path d="M11 7v20l17-10z" fill="currentColor" /></svg>
      <span>Reproducir · {fmt(duration)}</span>
    </button>
  {/if}
  {#if ready}
    <div class="vp-bar">
      <button type="button" class="vp-b" onclick={toggle} aria-label={playing ? 'Pausa' : 'Reproducir'}>
        {#if playing}<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="4" y="3" width="3.5" height="12" fill="currentColor" /><rect x="10.5" y="3" width="3.5" height="12" fill="currentColor" /></svg>
        {:else}<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3v12l10-6z" fill="currentColor" /></svg>{/if}
      </button>
      <span class="vp-t mono">{fmt(t)}</span>
      <input class="vp-range" type="range" min="0" max={dur} step="0.1" value={t} oninput={seek} aria-label="Posición del vídeo" aria-valuetext={`${fmt(t)} de ${fmt(dur)}`} style:--p={`${(t / dur) * 100}%`} />
      <span class="vp-t mono">{fmt(dur)}</span>
      <button type="button" class="vp-b" onclick={mute} aria-label={muted ? 'Activar el sonido' : 'Silenciar'} aria-pressed={muted}>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 7h3l4-3v10l-4-3H2z" fill="currentColor" />{#if muted}<path d="M12 6l5 6M17 6l-5 6" stroke="currentColor" stroke-width="1.6" />{:else}<path d="M12 6.5a4 4 0 0 1 0 5M14 4.5a7 7 0 0 1 0 9" stroke="currentColor" stroke-width="1.4" fill="none" />{/if}</svg>
      </button>
      <button type="button" class="vp-b" onclick={full} aria-label="Pantalla completa">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 6V2h4M12 2h4v4M16 12v4h-4M6 16H2v-4" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>
      </button>
    </div>
  {/if}
</div>

<style>
  .vp { position: relative; background: #000; aspect-ratio: 16 / 9; width: 100%; --focus: var(--ion); }
  .vp video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #000; }
  .vp:fullscreen { aspect-ratio: auto; }
  .vp-big {
    position: absolute; left: 50%; top: 50%; translate: -50% -50%; display: inline-flex; align-items: center; gap: 12px;
    min-height: 56px; padding: 0 22px 0 16px; border: 0; border-radius: 4px; background: var(--ion); color: var(--char);
    font: 600 16px var(--f-sans);
  }
  .vp-big:hover { background: var(--char-ink); }
  .vp-bar {
    position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: center; gap: 6px; padding: 6px 8px;
    background: linear-gradient(0deg, rgba(21,25,26,.92), rgba(21,25,26,.6)); color: var(--char-ink);
    opacity: 1; transition: opacity 200ms ease-out;
  }
  .vp.is-playing:not(:hover):not(:focus-within) .vp-bar { opacity: 0; }
  @media (hover: none) { .vp.is-playing .vp-bar { opacity: 1 !important; } }
  .vp-b { width: 44px; height: 44px; display: grid; place-items: center; border: 0; background: none; color: inherit; border-radius: 4px; flex: none; }
  .vp-b:hover { background: rgba(238,240,231,.1); }
  .vp-t { font-size: 12.5px; color: var(--char-muted); min-width: 3ch; }
  .vp-range { -webkit-appearance: none; appearance: none; flex: 1; min-width: 0; height: 44px; background: transparent; cursor: pointer; }
  .vp-range::-webkit-slider-runnable-track { height: 4px; background: linear-gradient(90deg, var(--ion) var(--p), var(--char-rule) var(--p)); }
  .vp-range::-moz-range-track { height: 4px; background: var(--char-rule); }
  .vp-range::-moz-range-progress { height: 4px; background: var(--ion); }
  .vp-range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; margin-top: -5px; border-radius: 50%; background: var(--ion); }
  .vp-range::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 50%; background: var(--ion); }
  @media (max-width: 480px) { .vp-t:first-of-type { display: none; } }
</style>
