import type { Btn, InputState } from './InputState';

interface Pad {
  btn: Btn;
  el: HTMLElement;
  cx: number;
  cy: number;
  r: number;
}

const LABEL: Record<Btn, string> = { left: '◀', right: '▶', down: '▼', jump: 'A', attack: 'B' };
const LEFT_SIDE: Btn[] = ['left', 'right', 'down'];
const RIGHT_SIDE: Btn[] = ['jump', 'attack'];

/**
 * DOM overlay virtual pad.
 * Every pointer is tracked by id; each one presses the nearest button on the
 * side of the screen where it started, so a thumb can slide between ◀ and ▶
 * without lifting, while other fingers hit jump/attack independently.
 */
export class TouchControls {
  private pads: Pad[] = [];
  private pointers = new Map<number, { x: number; y: number; side: 'L' | 'R' }>();
  private pressed = new Set<Btn>();

  constructor(
    private root: HTMLElement,
    private input: InputState,
  ) {
    for (const btn of [...LEFT_SIDE, ...RIGHT_SIDE]) {
      const el = document.createElement('div');
      el.className = 'tbtn';
      el.dataset.btn = btn;
      el.textContent = LABEL[btn];
      root.appendChild(el);
      this.pads.push({ btn, el, cx: 0, cy: 0, r: 0 });
    }

    const opts: AddEventListenerOptions = { passive: false };
    root.addEventListener('pointerdown', this.onDown, opts);
    root.addEventListener('pointermove', this.onMove, opts);
    root.addEventListener('pointerup', this.onUp, opts);
    root.addEventListener('pointercancel', this.onUp, opts);
    root.addEventListener('lostpointercapture', this.onUp, opts);
    window.addEventListener('resize', () => this.layout());
    window.addEventListener('orientationchange', () => this.layout());
    window.addEventListener('blur', () => this.reset());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.reset();
    });
  }

  static isTouchDevice(): boolean {
    return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  }

  show(): void {
    this.root.classList.add('on');
    this.layout();
  }

  private layout(): void {
    for (const p of this.pads) {
      const r = p.el.getBoundingClientRect();
      p.cx = r.left + r.width / 2;
      p.cy = r.top + r.height / 2;
      p.r = r.width / 2;
    }
  }

  private onDown = (e: PointerEvent): void => {
    e.preventDefault();
    if (this.pads[0].r === 0) this.layout();
    const side = e.clientX < window.innerWidth / 2 ? 'L' : 'R';
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, side });
    try {
      this.root.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointers cannot always be captured */
    }
    this.evaluate();
  };

  private onMove = (e: PointerEvent): void => {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    e.preventDefault();
    p.x = e.clientX;
    p.y = e.clientY;
    this.evaluate();
  };

  private onUp = (e: PointerEvent): void => {
    if (!this.pointers.delete(e.pointerId)) return;
    this.evaluate();
  };

  private reset(): void {
    this.pointers.clear();
    this.evaluate();
  }

  private evaluate(): void {
    const now = new Set<Btn>();
    for (const p of this.pointers.values()) {
      const group = p.side === 'L' ? LEFT_SIDE : RIGHT_SIDE;
      let best: Pad | null = null;
      let bestD = Infinity;
      for (const pad of this.pads) {
        if (!group.includes(pad.btn)) continue;
        const d = Math.hypot(p.x - pad.cx, p.y - pad.cy);
        // generous hit radius: fingers are imprecise and nobody looks at the pad
        if (d < pad.r * 1.9 && d < bestD) {
          best = pad;
          bestD = d;
        }
      }
      if (best) now.add(best.btn);
    }
    for (const pad of this.pads) {
      const on = now.has(pad.btn);
      if (on !== this.pressed.has(pad.btn)) {
        this.input.set('touch', pad.btn, on);
        pad.el.classList.toggle('active', on);
        if (on && navigator.vibrate) navigator.vibrate(8);
      }
    }
    this.pressed = now;
  }
}
