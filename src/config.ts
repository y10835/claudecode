export const GAME_W = 320;
export const GAME_H = 180;
export const TILE = 16;

/** Player feel constants. Times in ms, speeds in px/s. */
export const PLAYER = {
  runSpeed: 92,
  groundAccel: 900,
  airAccel: 620,
  groundFriction: 1100,
  airFriction: 250,
  gravity: 760,
  jumpVelocity: -262,
  jumpCut: 0.45,
  maxFall: 330,
  coyoteMs: 100,
  jumpBufferMs: 120,
  dropThroughMs: 220,
} as const;
