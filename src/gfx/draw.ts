import Phaser from 'phaser';

export type Ctx = CanvasRenderingContext2D;

export function rect(c: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

export function px(c: Ctx, x: number, y: number, color: string): void {
  c.fillStyle = color;
  c.fillRect(x, y, 1, 1);
}

/** Deterministic PRNG so generated art is identical on every boot. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Creates a canvas texture and registers `frames` equal cells as numbered frames. */
export function makeSheet(
  scene: Phaser.Scene,
  key: string,
  fw: number,
  fh: number,
  frames: number,
  paint: (c: Ctx) => void,
): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, fw * frames, fh)!;
  const c = tex.getContext();
  c.imageSmoothingEnabled = false;
  paint(c);
  for (let i = 0; i < frames; i++) tex.add(i, 0, i * fw, 0, fw, fh);
  tex.refresh();
}
