import Phaser from 'phaser';
import { GAME_W, GAME_H, FLOOR_Y, CAT } from '../config.js';
import { WINDOW } from '../art/RoomArt.js';
import { Boss } from '../entities/Boss.js';
import { Chair } from '../entities/Chair.js';
import { Effects } from '../systems/Effects.js';
import { InputController } from '../systems/InputController.js';
import { PunchController } from '../systems/PunchController.js';
import { Reactions } from '../systems/Reactions.js';
import { bus, EV } from '../core/events.js';
import { audio } from '../audio/AudioManager.js';

const STEP_MS = 1000 / 60;

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.acc = 0;
    this.buildRoom();
    this.buildColliders();

    this.chair = new Chair(this);
    this.boss = new Boss(this);
    this.effects = new Effects(this, this.boss);
    this.inputCtl = new InputController(this, this.boss);
    this.punch = new PunchController(this, this.boss);
    this.reactions = new Reactions(this, this.boss, this.effects);

    // vignette on top of everything in the world (not interactive)
    const v = this.add.graphics().setDepth(80);
    for (let i = 0; i < 12; i++) {
      v.lineStyle(26, 0x000000, 0.035 * (12 - i) / 12 * 1.5);
      v.strokeRect(-10 + i * 12, -10 + i * 12, GAME_W + 20 - i * 24, GAME_H + 20 - i * 24);
    }

    this.onReset = () => this.resetBoss();
    bus.on(EV.RESET, this.onReset);
    this.events.on('boss-safety-reset', () => this.resetBoss(true));
    this.events.once('shutdown', () => {
      bus.off(EV.RESET, this.onReset);
      this.punch.destroy(); this.reactions.destroy(); this.boss.destroy();
    });

    // let the ragdoll settle into the chair before the player sees it
    for (let i = 0; i < 30; i++) this.matter.world.step(STEP_MS);
    window.__game = { scene: this, boss: this.boss, audio };   // handy for debugging in DevTools
  }

  buildRoom() {
    this.add.image(0, 0, 'sky').setOrigin(0).setDepth(0);
    this.clouds = this.add.tileSprite(WINDOW.x, WINDOW.y + 20, WINDOW.w, 200, 'clouds').setOrigin(0).setDepth(1);
    this.add.image(0, 0, 'skyline').setOrigin(0).setDepth(2);
    this.add.image(0, 0, 'room').setOrigin(0).setDepth(3);

    // lamp glows (gentle flicker) and projector beam
    this.glows = [300, 640, 980].map(x => this.add.image(x, 78, 'fx_glow').setDepth(4).setBlendMode(Phaser.BlendModes.ADD).setScale(1.3, 0.9));
    this.beam = this.add.image(518, 84, 'fx_beam').setOrigin(1, 0.02).setDepth(4).setBlendMode(Phaser.BlendModes.ADD).setScale(0.9, 0.95);
    // plants sway from the pot
    this.plants = [
      this.add.image(400, 640, 'plant0').setOrigin(0.5, 1).setDepth(5),
      this.add.image(1030, 646, 'plant1').setOrigin(0.5, 1).setDepth(5).setScale(0.9)
    ];
  }

  buildColliders() {
    const opts = (label) => ({ isStatic: true, label, friction: 0.8, restitution: 0.05, collisionFilter: { category: CAT.WORLD, mask: 0xffff } });
    const r = (x, y, w, h, label) => this.matter.add.rectangle(x, y, w, h, opts(label));
    r(GAME_W / 2, FLOOR_Y + 60, GAME_W + 400, 120, 'floor');
    r(-40, GAME_H / 2, 80, GAME_H * 3, 'wall');
    r(GAME_W + 40, GAME_H / 2, 80, GAME_H * 3, 'wall');
    r(GAME_W / 2, -40, GAME_W + 400, 80, 'ceiling');
    r(162, 508, 368, 24, 'table');
    r(1176, 577, 240, 126, 'credenza');
  }

  resetBoss(silent = false) {
    this.inputCtl.cancel();
    this.chair.reset();
    this.boss.pose();
    for (let i = 0; i < 10; i++) this.matter.world.step(STEP_MS);
    this.effects.flash(this.boss.center.x, this.boss.center.y - 60, 0.9);
    if (!silent) {
      audio.play('reset');
      this.boss.setExpression('smug', 1200);
    }
  }

  update(time, delta) {
    // fixed-step physics: same behaviour on 60 Hz, 90 Hz and 120 Hz phones
    this.acc += Math.min(delta, 100);
    let steps = 0;
    while (this.acc >= STEP_MS && steps < 4) {
      this.matter.world.step(STEP_MS);
      this.acc -= STEP_MS;
      steps++;
    }
    if (steps === 4) this.acc = 0;

    this.boss.syncVisuals(time);
    this.effects.update(time);

    // ambient animation
    this.clouds.tilePositionX += delta * 0.006;
    this.glows.forEach((g, i) => g.setAlpha(0.85 + Math.sin(time / 900 + i * 2) * 0.05 + (Math.random() < 0.004 ? -0.2 : 0)));
    this.beam.setAlpha(0.55 + Math.sin(time / 300) * 0.04 + Math.sin(time / 47) * 0.02);
    this.plants.forEach((p, i) => p.setRotation(Math.sin(time / (1400 + i * 300) + i) * 0.018));
  }
}
