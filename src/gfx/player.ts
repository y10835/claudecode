import Phaser from 'phaser';
import { makeSheet, px, rect, type Ctx } from './draw';

export const PLAYER_FRAME = 24;

const C = {
  skin: '#e9a86c',
  skinD: '#b9753f',
  hair: '#d0442c',
  hairD: '#96281c',
  pelt: '#3f78b4',
  peltD: '#27507f',
  wood: '#e6dcc0',
  stone: '#8f98a3',
  stoneD: '#5f6873',
  eye: '#1c1014',
};

interface Pose {
  bob: number; // upper body drop in px
  l1: number; // back leg x shift
  l2: number; // front leg x shift
  lift1?: number; // leg raised by n px
  lift2?: number;
  crouch?: boolean;
  club?: 'rest' | 'up';
}

function drawPose(c: Ctx, ox: number, p: Pose): void {
  const by = p.bob + (p.crouch ? 5 : 0);
  const legTop = 19 + (p.crouch ? 3 : 0);

  // legs
  const leg = (x: number, lift: number): void => {
    const top = legTop;
    const bottom = 23 - lift;
    if (bottom > top) rect(c, ox + x, top, 2, bottom - top, C.skin);
    rect(c, ox + x, bottom, 3, 1, C.skinD);
  };
  leg(9 + p.l1, p.lift1 ?? 0);
  leg(12 + p.l2, p.lift2 ?? 0);

  // pelt body
  rect(c, ox + 8, 13 + by, 7, 6, C.pelt);
  rect(c, ox + 8, 13 + by, 1, 6, C.peltD);
  px(c, ox + 10, 13 + by, C.skin); // one-shoulder cut
  px(c, ox + 9, 13 + by, C.skin);
  px(c, ox + 9, 14 + by, C.skin);
  for (let i = 0; i < 4; i++) px(c, ox + 8 + i * 2, 19 + by, C.pelt); // ragged hem
  px(c, ox + 12, 16 + by, C.peltD);
  px(c, ox + 13, 17 + by, C.peltD);

  // head
  rect(c, ox + 8, 6 + by, 8, 7, C.skin);
  rect(c, ox + 8, 12 + by, 8, 1, C.skinD);
  px(c, ox + 16, 10 + by, C.skin); // nose
  px(c, ox + 13, 9 + by, C.eye);
  px(c, ox + 13, 8 + by, C.hairD); // brow
  px(c, ox + 14, 8 + by, C.hairD);
  px(c, ox + 14, 11 + by, C.eye); // mouth

  // hair
  rect(c, ox + 7, 4 + by, 9, 3, C.hair);
  rect(c, ox + 7, 7 + by, 2, 4, C.hair);
  px(c, ox + 8, 3 + by, C.hair);
  px(c, ox + 11, 3 + by, C.hair);
  px(c, ox + 14, 3 + by, C.hair);
  px(c, ox + 7, 11 + by, C.hairD);
  rect(c, ox + 7, 6 + by, 1, 2, C.hairD);

  // arm + club
  if (p.club === 'up') {
    rect(c, ox + 14, 11 + by, 2, 3, C.skin);
    rect(c, ox + 15, 5 + by, 1, 6, C.wood);
    rect(c, ox + 13, 1 + by, 5, 4, C.stone);
    rect(c, ox + 13, 4 + by, 5, 1, C.stoneD);
  } else {
    rect(c, ox + 14, 14 + by, 2, 3, C.skin);
    rect(c, ox + 16, 12 + by, 1, 5, C.wood);
    rect(c, ox + 15, 7 + by, 4, 5, C.stone);
    rect(c, ox + 15, 11 + by, 4, 1, C.stoneD);
    px(c, ox + 18, 7 + by, C.stoneD);
  }
}

/** frame order: idle0 idle1 run0..3 jump fall crouch */
const POSES: Pose[] = [
  { bob: 0, l1: 0, l2: 0 },
  { bob: 1, l1: 0, l2: 0 },
  { bob: 0, l1: -2, l2: 2, lift1: 1 },
  { bob: 1, l1: 0, l2: 0 },
  { bob: 0, l1: 2, l2: -2, lift2: 1 },
  { bob: 1, l1: 0, l2: 0, lift1: 1 },
  { bob: 0, l1: -1, l2: 1, lift1: 2, lift2: 3, club: 'up' },
  { bob: 0, l1: -1, l2: 2, lift2: 1, club: 'up' },
  { bob: 0, l1: -1, l2: 1, crouch: true },
];

export function createPlayerTexture(scene: Phaser.Scene): void {
  makeSheet(scene, 'player', PLAYER_FRAME, PLAYER_FRAME, POSES.length, (c) => {
    POSES.forEach((p, i) => drawPose(c, i * PLAYER_FRAME, p));
  });
  const a = scene.anims;
  const mk = (key: string, frames: number[], frameRate: number, repeat = -1): void => {
    if (a.exists(key)) return;
    a.create({ key, frames: frames.map((f) => ({ key: 'player', frame: f })), frameRate, repeat });
  };
  mk('p-idle', [0, 1], 2.5);
  mk('p-run', [2, 3, 4, 5], 12);
  mk('p-jump', [6], 1);
  mk('p-fall', [7], 1);
  mk('p-crouch', [8], 1);
}
