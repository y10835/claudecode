import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import { Player } from '../entities/Player';
import { T } from '../gfx/tiles';
import { LEVELS } from '../levels';
import type { InputState } from '../systems/input/InputState';
import { Level } from '../systems/level/Level';

export class GameScene extends Phaser.Scene {
  level!: Level;
  player!: Player;
  levelKey = 'test';
  private far!: Phaser.GameObjects.TileSprite;
  private mid!: Phaser.GameObjects.TileSprite;

  constructor() {
    super('Game');
  }

  private get input2(): InputState {
    return this.registry.get('input') as InputState;
  }

  init(data: { level?: string }): void {
    this.levelKey = data.level ?? 'test';
  }

  create(): void {
    const data = LEVELS[this.levelKey];
    const theme = data.theme;

    this.add.image(0, 0, `bg-sky-${theme}`).setOrigin(0).setScrollFactor(0).setDepth(-30);
    this.far = this.add.tileSprite(0, 0, GAME_W, GAME_H, `bg-far-${theme}`).setOrigin(0).setScrollFactor(0).setDepth(-20);
    this.mid = this.add.tileSprite(0, 0, GAME_W, GAME_H, `bg-mid-${theme}`).setOrigin(0).setScrollFactor(0).setDepth(-10);

    this.level = new Level(this, data);
    const { widthPx, heightPx } = this.level;

    // open at the bottom so pits are lethal instead of a floor
    this.physics.world.setBounds(0, -64, widthPx, heightPx + 256);
    this.physics.world.setBoundsCollision(true, true, false, false);

    this.player = new Player(this, this.level.spawn.x, this.level.spawn.y, this.level);
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, this.level.layer, undefined, (obj, tileObj) => {
      const tile = tileObj as unknown as Phaser.Tilemaps.Tile;
      if (tile.index !== T.PLATFORM) return true;
      const p = obj as Player;
      if (p.dropTimer > 0) return false;
      // only land when the feet were above the platform last step (no snap-up from inside)
      return p.body.prev.y + p.body.height <= tile.pixelY + 1;
    });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, widthPx, heightPx);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 0.18, 0.18, 0, 20);
    cam.setDeadzone(36, 28);
  }

  update(_time: number, delta: number): void {
    const input = this.input2;
    this.player.tick(Math.min(delta, 50), input);
    input.endFrame();

    if (this.player.y > this.level.heightPx + 48) {
      this.player.respawn(this.level.spawn.x, this.level.spawn.y);
    }

    const sx = this.cameras.main.scrollX;
    this.far.tilePositionX = Math.round(sx * 0.15);
    this.mid.tilePositionX = Math.round(sx * 0.4);
  }
}
