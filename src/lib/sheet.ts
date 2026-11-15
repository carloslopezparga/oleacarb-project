/* Hoja inferior (bottom sheet) arrastrable para el móvil. Se cierra arrastrando hacia abajo, con × o con Escape. */
export class BottomSheet {
  el: HTMLElement;
  body: HTMLElement;
  private lastFocus: HTMLElement | null = null;
  private onClose?: () => void;

  constructor(el: HTMLElement, onClose?: () => void) {
    this.el = el;
    this.body = el.querySelector<HTMLElement>('.bs-body') ?? el;
    this.onClose = onClose;
    el.querySelector('.bs-close')?.addEventListener('click', () => this.close());
    // Solo una hoja abierta a la vez
    window.addEventListener('sheet:open', (e) => { if ((e as CustomEvent<HTMLElement>).detail !== el) this.close(); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); this.close(); } });
    const grab = el.querySelector<HTMLElement>('.grab');
    if (grab) {
      let y0 = 0, dy = 0, dragging = false;
      grab.addEventListener('pointerdown', (e) => {
        if ((e.target as Element).closest('button')) return;
        dragging = true; y0 = e.clientY; dy = 0; grab.setPointerCapture(e.pointerId); el.style.transition = 'none';
      });
      grab.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        dy = Math.max(0, e.clientY - y0); el.style.transform = `translateY(${dy}px)`;
      });
      const end = () => {
        if (!dragging) return;
        dragging = false; el.style.transition = ''; el.style.transform = '';
        if (dy > 80) this.close();
      };
      grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
    }
  }

  get isOpen(): boolean { return this.el.classList.contains('is-open'); }

  open(html?: string | Node): void {
    if (html !== undefined) {
      if (typeof html === 'string') this.body.innerHTML = html; else this.body.replaceChildren(html);
    }
    if (!this.isOpen) this.lastFocus = document.activeElement as HTMLElement | null;
    window.dispatchEvent(new CustomEvent('sheet:open', { detail: this.el }));
    this.el.classList.add('is-open');
    this.body.scrollTop = 0; this.el.scrollTop = 0;
    requestAnimationFrame(() => this.el.querySelector<HTMLElement>('.bs-close')?.focus({ preventScroll: true }));
  }

  close(): void {
    if (!this.isOpen) return;
    this.el.classList.remove('is-open');
    this.onClose?.();
    this.lastFocus?.focus?.({ preventScroll: true });
  }
}
