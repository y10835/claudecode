import { test } from '@playwright/test';
import { boot, Fingers } from '../helpers';

// Not a check: captures screenshots for visual review. Run with SHOT=1.
test.skip(!process.env.SHOT, 'screenshot helper');
test('screenshots', async ({ page }) => {
  await boot(page);
  const dir = process.env.SHOT_DIR ?? 'test-results';
  await page.screenshot({ path: `${dir}/m1-idle.png` });
  const f = await Fingers.create(page);
  await f.press(1, 'right');
  await page.waitForTimeout(1200);
  await f.press(2, 'jump');
  await page.waitForTimeout(180);
  await page.screenshot({ path: `${dir}/m1-jump.png` });
});
