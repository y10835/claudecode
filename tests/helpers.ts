import type { CDPSession, Page } from '@playwright/test';

export interface Snap {
  scene: string;
  level: string | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  crouching: boolean;
  fps: number;
  zoom: number;
  paused: boolean;
}

export const snap = (page: Page): Promise<Snap> =>
  page.evaluate(() => window.__game.snapshot() as unknown as Snap);

export async function boot(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__game?.snapshot().scene === 'Game');
  // let the player settle on the ground
  await page.waitForFunction(() => window.__game.snapshot().onGround === true);
}

/** Real multi-touch through CDP: each finger keeps its own id while held. */
export class Fingers {
  private points = new Map<number, { x: number; y: number }>();
  private constructor(
    private cdp: CDPSession,
    private page: Page,
  ) {}

  static async create(page: Page): Promise<Fingers> {
    return new Fingers(await page.context().newCDPSession(page), page);
  }

  private list() {
    return [...this.points].map(([id, p]) => ({ id, x: p.x, y: p.y, radiusX: 12, radiusY: 12, force: 1 }));
  }

  private async center(btn: string): Promise<{ x: number; y: number }> {
    const box = await this.page.locator(`.tbtn[data-btn="${btn}"]`).boundingBox();
    if (!box) throw new Error(`no button ${btn}`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  async press(id: number, btn: string): Promise<void> {
    this.points.set(id, await this.center(btn));
    await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: this.list() });
  }

  async slide(id: number, btn: string): Promise<void> {
    this.points.set(id, await this.center(btn));
    await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: this.list() });
  }

  async release(id: number): Promise<void> {
    this.points.delete(id);
    await this.cdp.send('Input.dispatchTouchEvent', {
      type: this.points.size ? 'touchMove' : 'touchEnd',
      touchPoints: this.list(),
    });
  }
}
