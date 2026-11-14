import Phaser from 'phaser';
import { PLAYER } from '../config';
import type { InputState } from '../systems/input/InputState';
import type { Level } from '../systems/level/Level';

const BODY_W = 10;
const STAND_H = 14;
const CROUCH_H = 10;
const FRAME = 24;

function approach(v: number, target: number, step: number): number {
  return v < target ? Math.min(v + step, target) : Math.max(v - step, target);
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  facing: 1 | -1 = 1;
  crouching = false;
  /** >0 while falling through a one-way platform */
  dropTimer = 0;
  /** ground traction multiplier (ice lowers it) */
  traction = 1;

  private coyote = 0;
  private buffer = 0;
  private jumping = false;

  constructor(scene: Phaser.Scene, x: number, y: number, private level: Level) {
    super(scene, x, y, 'player', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(10);
    this.body.setGravityY(PLAYER.gravity);
    this.body.setMaxVelocity(400, PLAYER.maxFall);
    this.setHitbox(false);
  }

  get onGround(): boolean {
    return this.body.blocked.down || this.body.touching.down;
  }

  private setHitbox(crouch: boolean): void {
    const h = crouch ? CROUCH_H : STAND_H;
    this.body.setSize(BODY_W, h);
    this.body.setOffset((FRAME - BODY_W) / 2, FRAME - h);
  }

  private canStand(): boolean {
    const top = this.body.bottom - STAND_H + 1;
    return !this.level.isSolidAt(this.body.left + 1, top) && !this.level.isSolidAt(this.body.right - 1, top);
  }

  tick(dtMs: number, input: InputState): void {
    const dt = dtMs / 1000;
    const body = this.body;
    const grounded = this.onGround;

    // --- crouch ---
    const wantCrouch = grounded && input.isDown('down');
    if (wantCrouch !== this.crouching && (wantCrouch || this.canStand())) {
      this.crouching = wantCrouch;
      this.setHitbox(wantCrouch);
    }

    // --- horizontal ---
    const axis = this.crouching ? 0 : input.axisX;
    if (input.axisX !== 0) this.facing = input.axisX as 1 | -1;
    const tr = grounded ? this.traction : 1;
    if (axis !== 0) {
      const accel = (grounded ? PLAYER.groundAccel : PLAYER.airAccel) * tr;
      body.velocity.x = approach(body.velocity.x, axis * PLAYER.runSpeed, accel * dt);
    } else {
      const fr = (grounded ? PLAYER.groundFriction : PLAYER.airFriction) * tr;
      body.velocity.x = approach(body.velocity.x, 0, fr * dt);
    }

    // --- jump: coyote time + input buffer + variable height ---
    this.coyote = grounded ? PLAYER.coyoteMs : this.coyote - dtMs;
    this.buffer = input.justPressed('jump') ? PLAYER.jumpBufferMs : this.buffer - dtMs;
    this.dropTimer -= dtMs;

    if (this.buffer > 0 && this.coyote > 0) {
      this.buffer = 0;
      const onOneWay =
        this.level.isOneWayAt(body.left + 1, body.bottom + 2) || this.level.isOneWayAt(body.right - 1, body.bottom + 2);
      const overSolid =
        this.level.isSolidAt(body.left + 1, body.bottom + 2) || this.level.isSolidAt(body.right - 1, body.bottom + 2);
      if (input.isDown('down') && onOneWay && !overSolid) {
        this.dropTimer = PLAYER.dropThroughMs;
        this.coyote = 0;
        body.velocity.y = 40;
      } else {
        if (this.crouching && this.canStand()) {
          this.crouching = false;
          this.setHitbox(false);
        }
        body.velocity.y = PLAYER.jumpVelocity;
        this.coyote = 0;
        this.jumping = true;
        this.emit('jump');
      }
    }
    if (this.jumping) {
      if (body.velocity.y >= 0) this.jumping = false;
      else if (!input.isDown('jump')) {
        body.velocity.y *= PLAYER.jumpCut;
        this.jumping = false;
      }
    }

    // --- visuals ---
    this.setFlipX(this.facing < 0);
    let anim = 'p-idle';
    if (!grounded) anim = body.velocity.y < 0 ? 'p-jump' : 'p-fall';
    else if (this.crouching) anim = 'p-crouch';
    else if (Math.abs(body.velocity.x) > 8) anim = 'p-run';
    this.anims.play(anim, true);
  }

  respawn(x: number, y: number): void {
    this.body.reset(x, y);
    this.crouching = false;
    this.setHitbox(false);
    this.jumping = false;
    this.buffer = 0;
  }
}
