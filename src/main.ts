import Phaser from 'phaser';
import { GAME_H, GAME_W } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { installGestureGuards } from './systems/input/guards';
import { InputState } from './systems/input/InputState';
import { attachKeyboard } from './systems/input/Keyboard';
import { TouchControls } from './systems/input/TouchControls';

installGestureGuards();

const input = new InputState();
attachKeyboard(input);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#14101c',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, fixedStep: true, fps: 60, tileBias: 8 },
  },
  input: { keyboard: false, mouse: false, touch: false, gamepad: false },
  audio: { noAudio: true },
  banner: false,
  scene: [BootScene, GameScene],
});
game.registry.set('input', input);

/**
 * Integer scaling: the 320x180 buffer is shown at a whole number of *device*
 * pixels per game pixel, so every game pixel is the same crisp square.
 */
function fit(): void {
  const dpr = window.devicePixelRatio || 1;
  const fitScale = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
  const zoom = Math.max(1, Math.floor(fitScale * dpr)) / dpr;
  game.scale.setZoom(zoom);
}
game.events.once(Phaser.Core.Events.READY, fit);
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', () => setTimeout(fit, 100));

// ---------- touch pad ----------
const touchRoot = document.getElementById('touch')!;
const touch = new TouchControls(touchRoot, input);
if (TouchControls.isTouchDevice()) touch.show();
else window.addEventListener('touchstart', () => touch.show(), { once: true });

// ---------- portrait: pause behind the rotate notice ----------
const portrait = window.matchMedia('(orientation: portrait) and (pointer: coarse)');
function applyOrientation(): void {
  if (portrait.matches) {
    input.releaseAll();
    game.pause();
  } else {
    game.resume();
    fit();
  }
}
portrait.addEventListener('change', applyOrientation);
game.events.once(Phaser.Core.Events.READY, applyOrientation);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) input.releaseAll();
});

// ---------- debug / test hook ----------
declare global {
  interface Window {
    __game: {
      phaser: Phaser.Game;
      snapshot(): Record<string, unknown>;
    };
  }
}
window.__game = {
  phaser: game,
  snapshot() {
    const scene = game.scene.getScene('Game') as GameScene;
    const active = game.scene.isActive('Game');
    const p = active ? scene.player : undefined;
    return {
      scene: active ? 'Game' : 'Boot',
      level: active ? scene.levelKey : null,
      x: p?.x ?? 0,
      y: p?.y ?? 0,
      vx: p?.body.velocity.x ?? 0,
      vy: p?.body.velocity.y ?? 0,
      onGround: p?.onGround ?? false,
      crouching: p?.crouching ?? false,
      fps: game.loop.actualFps,
      zoom: game.scale.zoom,
      paused: game.isPaused,
    };
  },
};
