import Phaser from 'phaser';
import { TILE } from '../../config';
import { T, tilesetKey } from '../../gfx/tiles';
import type { LevelData, LevelObject } from '../../levels/types';

const SOLID = '#';

export class Level {
  readonly map: Phaser.Tilemaps.Tilemap;
  readonly layer: Phaser.Tilemaps.TilemapLayer;
  readonly cols: number;
  readonly rows: number;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly spawn = new Phaser.Math.Vector2(TILE * 2, TILE * 2);
  readonly objects: LevelObject[] = [];

  constructor(scene: Phaser.Scene, readonly data: LevelData) {
    this.rows = data.tiles.length;
    this.cols = Math.max(...data.tiles.map((r) => r.length));
    const grid = data.tiles.map((r) => r.padEnd(this.cols, '.'));
    this.widthPx = this.cols * TILE;
    this.heightPx = this.rows * TILE;

    const indices: number[][] = [];
    for (let y = 0; y < this.rows; y++) {
      const row: number[] = [];
      for (let x = 0; x < this.cols; x++) {
        const ch = grid[y][x];
        let idx = -1;
        if (ch === SOLID) idx = y > 0 && grid[y - 1][x] === SOLID ? T.GROUND : T.GROUND_TOP;
        else if (ch === '=') idx = T.PLATFORM;
        else if (ch === 'B') idx = T.BREAKABLE;
        else if (ch === 'P') this.spawn.set(x * TILE + TILE / 2, (y + 1) * TILE);
        else if (ch !== '.') this.objects.push({ type: ch, x, y });
        row.push(idx);
      }
      indices.push(row);
    }
    for (const o of data.objects ?? []) this.objects.push(o);

    this.map = scene.make.tilemap({ data: indices, tileWidth: TILE, tileHeight: TILE });
    const key = tilesetKey(data.theme);
    const tileset = this.map.addTilesetImage(key, key, TILE, TILE, 0, 0)!;
    this.layer = this.map.createLayer(0, tileset, 0, 0)!;
    this.layer.setCollision([T.GROUND_TOP, T.GROUND, T.BREAKABLE]);
    this.layer.forEachTile((t) => {
      if (t.index === T.PLATFORM) t.setCollision(false, false, true, false);
    });
  }

  tileAtWorld(x: number, y: number): Phaser.Tilemaps.Tile | null {
    return this.layer.getTileAtWorldXY(x, y) ?? null;
  }

  isOneWayAt(x: number, y: number): boolean {
    return this.tileAtWorld(x, y)?.index === T.PLATFORM;
  }

  isSolidAt(x: number, y: number): boolean {
    const t = this.tileAtWorld(x, y);
    return !!t && t.index !== T.PLATFORM && t.index >= 0;
  }
}
