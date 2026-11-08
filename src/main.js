import Phaser from 'phaser';
import { GAME_W, GAME_H, PHYSICS } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { Hud } from './ui/Hud.js';

// ---- stop the browser from scrolling, zooming or opening menus while playing
const block = e => { if (!(e.target instanceof HTMLInputElement)) e.preventDefault(); };
document.addEventListener('touchmove', block, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#16141a',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 2 },
  render: { antialias: true, powerPreference: 'high-performance' },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: PHYSICS.gravityY },
      autoUpdate: false,              // we step physics ourselves at a fixed 60 Hz (GameScene.update)
      positionIterations: 10,
      velocityIterations: 8,
      constraintIterations: 6,
      enableSleeping: false,
      debug: false
    }
  },
  scene: [BootScene, GameScene]
});

game.events.once('ready', () => { window.hud = new Hud(game); });
