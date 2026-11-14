export type Btn = 'left' | 'right' | 'down' | 'jump' | 'attack';
export type Source = 'kb' | 'touch';

const BTNS: Btn[] = ['left', 'right', 'down', 'jump', 'attack'];

function blank(): Record<Btn, boolean> {
  return { left: false, right: false, down: false, jump: false, attack: false };
}

/**
 * Merges keyboard and touch into one button state.
 * Presses are latched until the game consumes the frame, so a tap that
 * starts and ends between two frames is never lost.
 */
export class InputState {
  private src: Record<Source, Record<Btn, boolean>> = { kb: blank(), touch: blank() };
  private latched = blank();

  set(source: Source, btn: Btn, down: boolean): void {
    if (this.src[source][btn] === down) return;
    if (down && !this.isDown(btn)) this.latched[btn] = true;
    this.src[source][btn] = down;
  }

  isDown(btn: Btn): boolean {
    return this.src.kb[btn] || this.src.touch[btn];
  }

  justPressed(btn: Btn): boolean {
    return this.latched[btn];
  }

  /** -1, 0 or 1 */
  get axisX(): number {
    return (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0);
  }

  endFrame(): void {
    for (const b of BTNS) this.latched[b] = false;
  }

  releaseAll(source?: Source): void {
    const sources: Source[] = source ? [source] : ['kb', 'touch'];
    for (const s of sources) for (const b of BTNS) this.src[s][b] = false;
  }
}
