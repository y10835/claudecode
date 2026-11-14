import type { Theme } from '../gfx/tiles';

/**
 * Level file format.
 *  tiles : rows of characters, top to bottom. Short rows are padded with '.'.
 *    '.' empty      '#' solid ground     '=' one-way platform
 *    'B' breakable  'P' player spawn
 *  objects : things that need parameters (tile coordinates).
 */
export interface LevelObject {
  type: string;
  x: number;
  y: number;
  [k: string]: unknown;
}

export interface LevelData {
  name: string;
  theme: Theme;
  tiles: string[];
  objects?: LevelObject[];
}
