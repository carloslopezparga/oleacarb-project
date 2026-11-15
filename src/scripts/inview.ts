/* Piezas que se dibujan, se llenan o se ensamblan al entrar en pantalla (CSS + clase is-in). */
import { markInView, reduced, gsap } from '../lib/motion';
import { num } from '../lib/format';

export function initInView(): void {
  markInView('.waffle, .eq, .prec, .vbars, .terr-map, .pl-fig, [data-inview]', 0.3);
  // La cuenta de la ecuación del reto rueda una vez.
  document.querySelectorAll<HTMLElement>('.eqn').forEach(el => {
    if (reduced) return;
    const to = Number(el.dataset.to);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const o = { v: 0 };
      el.textContent = num(0);
      gsap.to(o, { v: to, duration: 1.1, delay: 0.5, ease: 'power2.out', onUpdate: () => { el.textContent = num(o.v); } });
    }, { threshold: 0.5 });
    io.observe(el);
  });
}
