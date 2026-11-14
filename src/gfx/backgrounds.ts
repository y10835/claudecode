import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import { rect, rng, type Ctx } from './draw';
import type { Theme } from './tiles';

interface BgPal {
  sky: string[]; // top → bottom bands
  orb: string;
  far: string;
  mid: string;
  midD: string;
}

const BG: Record<Theme, BgPal> = {
  forest: { sky: ['#5fb4e8', '#7cc6ee', '#9dd8f2', '#c4e9f4', '#e6f5ee'], orb: '#fff3b0', far: '#7fb9a0', mid: '#3d8a57', midD: '#2c6b47' },
  ice: { sky: ['#1d2b53', '#2a3f73', '#3c5a96', '#5a7fba', '#86a9d8'], orb: '#eaf6ff', far: '#5874a8', mid: '#35508a', midD: '#263c6c' },
  volcano: { sky: ['#2a1020', '#4a1626', '#7a2226', '#aa3a22', '#d86a26'], orb: '#ffd27a', far: '#4a2028', mid: '#2e1620', midD: '#1e0e16' },
};

function canvas(scene: Phaser.Scene, key: string, paint: (c: Ctx) => void): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, GAME_W, GAME_H)!;
  paint(tex.getContext());
  tex.refresh();
}

function ridge(c: Ctx, color: string, base: number, amp: number, seed: number, step: number): void {
  const r = rng(seed);
  // Height field that wraps seamlessly at GAME_W so the layer can tile.
  const n = Math.ceil(GAME_W / step);
  const pts: number[] = [];
  for (let i = 0; i < n; i++) pts.push(base - r() * amp);
  for (let x = 0; x < GAME_W; x++) {
    const f = x / step;
    const i = Math.floor(f);
    const t = f - i;
    const a = pts[i % n];
    const b = pts[(i + 1) % n];
    const y = Math.round(a + (b - a) * (t * t * (3 - 2 * t)));
    rect(c, x, y, 1, GAME_H - y, color);
  }
}

export function createBackgrounds(scene: Phaser.Scene): void {
  (Object.keys(BG) as Theme[]).forEach((theme, ti) => {
    const p = BG[theme];
    canvas(scene, `bg-sky-${theme}`, (c) => {
      const band = GAME_H / p.sky.length;
      p.sky.forEach((col, i) => rect(c, 0, Math.round(i * band), GAME_W, Math.ceil(band), col));
      // dithered band edges
      p.sky.forEach((col, i) => {
        if (i === 0) return;
        const y = Math.round(i * band);
        for (let x = 0; x < GAME_W; x += 2) rect(c, x + (i % 2), y - 1, 1, 1, col);
      });
      c.fillStyle = p.orb;
      c.beginPath();
      c.arc(248, 40, 14, 0, Math.PI * 2);
      c.fill();
    });
    canvas(scene, `bg-far-${theme}`, (c) => ridge(c, p.far, 120, 46, 11 + ti, 40));
    canvas(scene, `bg-mid-${theme}`, (c) => {
      ridge(c, p.mid, 150, 30, 91 + ti, 20);
      const r = rng(300 + ti);
      for (let i = 0; i < 10; i++) {
        const x = 8 + Math.floor(r() * (GAME_W - 24));
        const h = 16 + Math.floor(r() * 22);
        if (theme === 'forest') {
          rect(c, x + 3, 150 - h + 8, 2, h, p.midD);
          for (let k = 0; k < 4; k++) rect(c, x + k - 1, 150 - h + k * 4, 10 - k * 2, 5, p.midD);
        } else {
          for (let k = 0; k < h; k++) rect(c, x + Math.floor(k / 4), 160 - k, Math.max(1, 8 - Math.floor(k / 3)), 1, p.midD);
        }
      }
    });
  });
}
