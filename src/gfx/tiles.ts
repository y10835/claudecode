import Phaser from 'phaser';
import { TILE } from '../config';
import { makeSheet, px, rect, rng, type Ctx } from './draw';

/** Tile indices inside every theme's tileset (0 = first cell). */
export const T = {
  GROUND_TOP: 0,
  GROUND: 1,
  PLATFORM: 2,
  BREAKABLE: 3,
} as const;
const COUNT = 4;

export type Theme = 'forest' | 'ice' | 'volcano';

interface Pal {
  top: string;
  topL: string;
  topD: string;
  soil: string;
  soilD: string;
  soilL: string;
  plank: string;
  plankD: string;
  block: string;
  blockD: string;
  blockL: string;
}

const PALS: Record<Theme, Pal> = {
  forest: {
    top: '#4fa83d', topL: '#7fd35a', topD: '#2f7a2c',
    soil: '#7a4f2e', soilD: '#56341f', soilL: '#9a6a3f',
    plank: '#b07a3e', plankD: '#74491f',
    block: '#b9a27a', blockD: '#7d6a4b', blockL: '#dcc9a0',
  },
  ice: {
    top: '#dff4ff', topL: '#ffffff', topD: '#9fd0ee',
    soil: '#4f7fb4', soilD: '#35598a', soilL: '#73a5d6',
    plank: '#9fd0ee', plankD: '#5d8fc0',
    block: '#bfe6fa', blockD: '#79b3da', blockL: '#f2fbff',
  },
  volcano: {
    top: '#5b4a4a', topL: '#8a6f66', topD: '#372c30',
    soil: '#3a2d33', soilD: '#231a20', soilL: '#55424a',
    plank: '#7d5a52', plankD: '#49312f',
    block: '#8c5a3c', blockD: '#573421', blockL: '#bb8257',
  },
};

function paint(c: Ctx, p: Pal, seed: number): void {
  const r = rng(seed);
  const cell = (i: number): number => i * TILE;

  // ground with surface
  let ox = cell(T.GROUND_TOP);
  rect(c, ox, 0, TILE, TILE, p.soil);
  rect(c, ox, 0, TILE, 4, p.top);
  rect(c, ox, 0, TILE, 1, p.topL);
  for (let x = 0; x < TILE; x++) {
    const d = 4 + Math.floor(r() * 3);
    rect(c, ox + x, 4, 1, d - 4, p.top);
    px(c, ox + x, d, p.topD);
  }
  for (let i = 0; i < 9; i++) px(c, ox + Math.floor(r() * 16), 8 + Math.floor(r() * 8), r() < 0.5 ? p.soilD : p.soilL);

  // inner ground
  ox = cell(T.GROUND);
  rect(c, ox, 0, TILE, TILE, p.soil);
  for (let i = 0; i < 14; i++) px(c, ox + Math.floor(r() * 16), Math.floor(r() * 16), r() < 0.6 ? p.soilD : p.soilL);
  rect(c, ox + 3, 5, 3, 2, p.soilD);
  rect(c, ox + 10, 11, 4, 2, p.soilD);
  px(c, ox + 3, 5, p.soilL);
  px(c, ox + 10, 11, p.soilL);

  // one-way platform (top 6px only)
  ox = cell(T.PLATFORM);
  rect(c, ox, 0, TILE, 5, p.plank);
  rect(c, ox, 0, TILE, 1, p.topL);
  rect(c, ox, 5, TILE, 1, p.plankD);
  px(c, ox + 4, 2, p.plankD);
  px(c, ox + 5, 3, p.plankD);
  px(c, ox + 11, 2, p.plankD);
  rect(c, ox + 2, 6, 2, 2, p.plankD);
  rect(c, ox + 12, 6, 2, 2, p.plankD);

  // breakable block
  ox = cell(T.BREAKABLE);
  rect(c, ox, 0, TILE, TILE, p.block);
  rect(c, ox, 0, TILE, 1, p.blockL);
  rect(c, ox, 0, 1, TILE, p.blockL);
  rect(c, ox, 15, TILE, 1, p.blockD);
  rect(c, ox + 15, 0, 1, TILE, p.blockD);
  const crack: Array<[number, number]> = [[7, 2], [7, 3], [8, 4], [8, 5], [7, 6], [6, 7], [6, 8], [7, 9], [8, 10], [9, 11], [9, 12], [5, 8], [4, 9], [10, 5], [11, 5]];
  for (const [x, y] of crack) px(c, ox + x, y, p.blockD);
}

export function tilesetKey(theme: Theme): string {
  return `tiles-${theme}`;
}

export function createTilesets(scene: Phaser.Scene): void {
  (Object.keys(PALS) as Theme[]).forEach((theme, i) => {
    makeSheet(scene, tilesetKey(theme), TILE, TILE, COUNT, (c) => paint(c, PALS[theme], 1000 + i * 77));
  });
}
