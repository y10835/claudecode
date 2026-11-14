import { expect, test } from '@playwright/test';
import { boot, Fingers, snap } from './helpers';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
  await boot(page);
});

test('boots into the game at an integer pixel scale', async ({ page }) => {
  const s = await snap(page);
  expect(s.scene).toBe('Game');
  expect(s.paused).toBe(false);

  const box = await page.locator('#game canvas').boundingBox();
  expect(box).not.toBeNull();
  // 844x390 @2x → 4 device px per game px → 640x360 css px
  expect(box!.width).toBe(640);
  expect(box!.height).toBe(360);
  for (const b of ['left', 'right', 'down', 'jump', 'attack']) {
    await expect(page.locator(`.tbtn[data-btn="${b}"]`)).toBeVisible();
  }
});

test('touch d-pad moves the player and sliding reverses direction', async ({ page }) => {
  const f = await Fingers.create(page);
  const x0 = (await snap(page)).x;

  await f.press(1, 'right');
  await page.waitForTimeout(500);
  const x1 = (await snap(page)).x;
  expect(x1).toBeGreaterThan(x0 + 20);

  await f.slide(1, 'left'); // same finger, no lift
  await page.waitForTimeout(500);
  const x2 = (await snap(page)).x;
  expect(x2).toBeLessThan(x1 - 10);

  await f.release(1);
  await page.waitForTimeout(300);
  expect(Math.abs((await snap(page)).vx)).toBeLessThan(1);
});

test('jump button: variable height, and multi-touch move + jump', async ({ page }) => {
  const f = await Fingers.create(page);
  const groundY = (await snap(page)).y;

  const peakOf = async (holdMs: number): Promise<number> => {
    let peak = groundY;
    await f.press(2, 'jump');
    const t0 = Date.now();
    let released = false;
    while (Date.now() - t0 < 900) {
      if (!released && Date.now() - t0 >= holdMs) {
        await f.release(2);
        released = true;
      }
      peak = Math.min(peak, (await snap(page)).y);
      await page.waitForTimeout(8);
    }
    await page.waitForFunction(() => window.__game.snapshot().onGround === true);
    return groundY - peak;
  };

  const tap = await peakOf(30);
  const hold = await peakOf(600);
  expect(tap).toBeGreaterThan(6);
  expect(hold).toBeGreaterThan(36);
  expect(hold).toBeGreaterThan(tap + 12);

  // two fingers at once: run right while jumping
  const x0 = (await snap(page)).x;
  await f.press(1, 'right');
  await f.press(2, 'jump');
  await page.waitForTimeout(200);
  const mid = await snap(page);
  expect(mid.onGround).toBe(false);
  expect(mid.vx).toBeGreaterThan(40);
  await f.release(2);
  await f.release(1);
  await page.waitForFunction(() => window.__game.snapshot().onGround === true);
  expect((await snap(page)).x).toBeGreaterThan(x0 + 10);
});

test('keyboard works alongside touch', async ({ page }) => {
  const x0 = (await snap(page)).x;
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.press('KeyZ');
  await page.waitForTimeout(120);
  expect((await snap(page)).onGround).toBe(false);
  await page.keyboard.up('ArrowRight');
  expect((await snap(page)).x).toBeGreaterThan(x0 + 10);
});

test('portrait shows the rotate notice and pauses the game', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#rotate')).toBeVisible();
  await expect.poll(async () => (await snap(page)).paused).toBe(true);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#rotate')).toBeHidden();
  await expect.poll(async () => (await snap(page)).paused).toBe(false);
});
