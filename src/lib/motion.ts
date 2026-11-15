/* Lenis + GSAP/ScrollTrigger sincronizados, con alternativa de movimiento reducido. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

let lenis: Lenis | null = null;
let started = false;

export function initMotion(): void {
  if (started) return;
  started = true;
  gsap.registerPlugin(ScrollTrigger);
  // La barra de direcciones de iOS cambia el alto al hacer scroll: no recalculamos por eso.
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (reduced) {
    gsap.globalTimeline.timeScale(1);
    return;
  }
  // Lenis solo con ratón o trackpad: en pantallas táctiles el scroll nativo es más fiable.
  if (!coarse) {
    lenis = new Lenis({ lerp: 0.14, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis?.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

export function getLenis(): Lenis | null { return lenis; }
export { gsap, ScrollTrigger };

/** Ejecuta fn la primera vez que el elemento se acerca a la pantalla. */
export function whenNear(el: Element, fn: () => void, margin = '400px 0px'): void {
  if (!('IntersectionObserver' in window)) { fn(); return; }
  const io = new IntersectionObserver((es) => {
    if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); }
  }, { rootMargin: margin });
  io.observe(el);
}

/** Añade la clase is-in la primera vez que el elemento entra en pantalla (para dibujar, llenar o ensamblar con CSS). */
export function markInView(selector: string, threshold = 0.25): void {
  const els = document.querySelectorAll(selector);
  if (reduced || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold });
  els.forEach(e => io.observe(e));
}
