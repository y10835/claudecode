import Phaser from 'phaser';
import { createBackgrounds } from '../gfx/backgrounds';
import { createPlayerTexture } from '../gfx/player';
import { createTilesets } from '../gfx/tiles';

/** Generates every texture in code; there are no external asset files. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    createTilesets(this);
    createBackgrounds(this);
    createPlayerTexture(this);
    this.scene.start('Game', { level: 'test' });
  }
}
