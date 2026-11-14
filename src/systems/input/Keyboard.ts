import type { Btn, InputState } from './InputState';

const MAP: Record<string, Btn> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowDown: 'down',
  KeyS: 'down',
  KeyZ: 'jump',
  Space: 'jump',
  ArrowUp: 'jump',
  KeyX: 'attack',
};

export function attachKeyboard(input: InputState): void {
  window.addEventListener('keydown', (e) => {
    const btn = MAP[e.code];
    if (!btn) return;
    e.preventDefault();
    if (!e.repeat) input.set('kb', btn, true);
  });
  window.addEventListener('keyup', (e) => {
    const btn = MAP[e.code];
    if (!btn) return;
    e.preventDefault();
    input.set('kb', btn, false);
  });
  window.addEventListener('blur', () => input.releaseAll());
}
