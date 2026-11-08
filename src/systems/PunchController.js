import Phaser from 'phaser';
import { HIT, GAME_W } from '../config.js';
import { bus, EV } from '../core/events.js';
import { audio } from '../audio/AudioManager.js';

/**
 * Dedicated punch button logic: a cartoon fist flies in from the side of the screen,
 * connects with the boss and applies a physical hit. Rapid presses build a chain;
 * every 4th quick punch in a row is a heavy haymaker.
 */
export class PunchController {
  constructor(scene, boss) {
    this.scene = scene;
    this.boss = boss;
    this.lastPunch = -1e9;
    this.chain = 0;
    this.fists = [];
    for (let i = 0; i < 4; i++) {
      this.fists.push(scene.add.image(0, 0, 'fist').setDepth(65).setVisible(false));
    }
    this.fi = 0;
    bus.on(EV.PUNCH_REQUEST, this.punch, this);
  }

  pickTarget() {
    const r = Math.random();
    const P = this.boss.parts;
    if (r < 0.55) return P.head;
    if (r < 0.88) return P.torso;
    return Math.random() < 0.5 ? P.upperArmR : P.upperArmL;
  }

  punch() {
    const now = this.scene.time.now;
    if (now - this.lastPunch < HIT.punchCooldownMs) return false;
    this.chain = now - this.lastPunch < HIT.chainWindowMs ? this.chain + 1 : 1;
    this.lastPunch = now;

    const heavy = this.chain % 4 === 0;
    const target = heavy ? this.boss.parts.head : this.pickTarget();
    // alternate hands; come from whichever side has more room
    const fromRight = target.x < GAME_W * 0.25 ? true : target.x > GAME_W * 0.75 ? false : this.chain % 2 === 1;
    const side = fromRight ? 1 : -1;
    const fist = this.fists[this.fi]; this.fi = (this.fi + 1) % this.fists.length;
    this.scene.tweens.killTweensOf(fist);

    const tx = target.x + side * 30, ty = target.y + (heavy ? 25 : 0);
    const sx = fromRight ? GAME_W + 120 : -120, sy = ty + 70 + Math.random() * 40;
    fist.setFlipX(!fromRight).setOrigin(fromRight ? 0.08 : 0.92, 0.5)
      .setPosition(sx, sy).setScale(heavy ? 1.15 : 0.95).setAngle(heavy ? side * 18 : side * 6).setVisible(true).setAlpha(1);

    audio.play('whoosh', { volume: 0.6 });
    this.scene.tweens.add({
      targets: fist, x: tx, y: ty, duration: heavy ? 95 : 75, ease: 'Quad.easeIn',
      onComplete: () => {
        // hit lands where the part is NOW (he may have moved)
        const strength = heavy ? 1.0 + Math.random() * 0.15 : Phaser.Math.Clamp(0.42 + Math.random() * 0.22 + this.chain * 0.03, 0, 0.8);
        let dx = target.x - sx, dy = (target.y - sy) - (heavy ? 160 : 40);
        const len = Math.hypot(dx, dy) || 1;
        const point = { x: target.x + side * 18, y: target.y };
        this.boss.hit(target.partName, point, { x: dx / len, y: dy / len }, strength, { source: 'punch' });
        fist.setPosition(target.x + side * 24, target.y);
        this.scene.tweens.add({
          targets: fist, x: sx, y: sy + 40, duration: 150, delay: 40, ease: 'Quad.easeOut',
          onComplete: () => fist.setVisible(false)
        });
      }
    });
    return true;
  }

  destroy() { bus.off(EV.PUNCH_REQUEST, this.punch, this); }
}
