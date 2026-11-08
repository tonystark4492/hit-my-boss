import Phaser from 'phaser';
import { WORDS } from '../art/FxArt.js';
import { FLOOR_Y } from '../config.js';

// Visual effects with pooling and hard caps so phones stay smooth.
export class Effects {
  constructor(scene, boss) {
    this.scene = scene;
    this.boss = boss;
    this.lastWordAt = 0;

    this.flashPool = this.makePool('fx_flash', 6, 60, Phaser.BlendModes.ADD);
    this.wordPools = {};
    Object.values(WORDS).flat().forEach(w => { this.wordPools[w] = this.makePool('word_' + w, 2, 62); });

    const P = (key, cfg) => scene.add.particles(0, 0, key, { emitting: false, ...cfg });
    this.sparks = P('fx_streak', {
      speed: { min: 280, max: 620 }, lifespan: { min: 120, max: 260 }, scale: { start: 1.1, end: 0.2 },
      alpha: { start: 1, end: 0 }, blendMode: 'ADD', maxParticles: 60,
      rotate: { onEmit: () => 0, onUpdate: p => Phaser.Math.RadToDeg(Math.atan2(p.velocityY, p.velocityX)) }
    }).setDepth(58);
    this.drops = P('fx_drop_red', {
      speed: { min: 140, max: 420 }, angle: { min: 200, max: 340 }, gravityY: 1300, lifespan: 700,
      scale: { start: 0.9, end: 0.5 }, rotate: { min: -40, max: 40 }, maxParticles: 50
    }).setDepth(57);
    this.sweat = P('fx_drop_sweat', {
      speed: { min: 80, max: 220 }, angle: { min: 200, max: 340 }, gravityY: 900, lifespan: 650,
      scale: { start: 0.8, end: 0.4 }, alpha: { start: 1, end: 0.2 }, maxParticles: 30
    }).setDepth(57);
    this.dust = P('fx_soft', {
      speed: { min: 30, max: 140 }, angle: { min: 180, max: 360 }, lifespan: { min: 400, max: 800 },
      scale: { start: 0.6, end: 1.8 }, alpha: { start: 0.45, end: 0 }, tint: 0xc9b6a0, gravityY: -20, maxParticles: 50
    }).setDepth(9);
    this.motes = P('fx_soft', {
      x: { min: 440, max: 1020 }, y: { min: 120, max: 560 }, lifespan: 7000, speedX: { min: -6, max: 6 }, speedY: { min: -8, max: 3 },
      scale: { min: 0.05, max: 0.14 }, alpha: { start: 0, end: 0.5, ease: 'Sine.easeInOut' }, frequency: 450, quantity: 1,
      blendMode: 'ADD', tint: 0xffd9a0, emitting: true, maxParticles: 18
    }).setDepth(4);

    // dizzy stars orbiting the head
    this.stars = [];
    for (let i = 0; i < 5; i++) this.stars.push(scene.add.image(0, 0, 'fx_star').setDepth(40).setVisible(false));

    // floor shadow
    this.shadow = scene.add.image(0, FLOOR_Y + 4, 'fx_shadow').setDepth(8).setAlpha(0.8);
  }

  makePool(key, size, depth, blend) {
    const arr = [];
    for (let i = 0; i < size; i++) {
      const img = this.scene.add.image(0, 0, key).setDepth(depth).setVisible(false);
      if (blend !== undefined) img.setBlendMode(blend);
      arr.push(img);
    }
    return { arr, i: 0 };
  }

  take(pool) {
    const img = pool.arr[pool.i];
    pool.i = (pool.i + 1) % pool.arr.length;
    this.scene.tweens.killTweensOf(img);
    return img.setVisible(true);
  }

  flash(x, y, strength) {
    const img = this.take(this.flashPool);
    const s = 0.35 + strength * 0.9;
    img.setPosition(x, y).setScale(s * 0.4).setAlpha(1).setRotation(Math.random() * Math.PI);
    this.scene.tweens.add({ targets: img, scale: s, alpha: 0, duration: 170, ease: 'Quad.easeOut', onComplete: () => img.setVisible(false) });
  }

  word(tier, x, y) {
    const now = this.scene.time.now;
    if (now - this.lastWordAt < 160) return;
    this.lastWordAt = now;
    const text = Phaser.Utils.Array.GetRandom(WORDS[tier]);
    const img = this.take(this.wordPools[text]);
    const base = tier === 'heavy' ? 1.05 : tier === 'medium' ? 0.85 : 0.6;
    const ox = Phaser.Math.Between(-60, 60), oy = Phaser.Math.Between(-90, -50);
    img.setPosition(x + ox, y + oy).setScale(base * 0.2).setAlpha(1).setAngle(Phaser.Math.Between(-14, 14));
    this.scene.tweens.add({ targets: img, scale: base, duration: 130, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: img, alpha: 0, y: img.y - 30, delay: 420, duration: 260, onComplete: () => img.setVisible(false) });
  }

  impact({ x, y, strength, part, dir, source }) {
    const tier = strength < 0.35 ? 'light' : strength < 0.7 ? 'medium' : 'heavy';
    if (source === 'impact') {
      if (strength > 0.25) this.dust.explode(Math.round(4 + strength * 10), x, y);
      if (strength > 0.55) this.word('impact', x, y);
      if (strength > 0.75) this.scene.cameras.main.shake(140, 0.006);
      return;
    }
    this.flash(x, y, strength);
    const ang = Phaser.Math.RadToDeg(Math.atan2(dir.y, dir.x));
    this.sparks.setEmitterAngle({ min: ang - 55, max: ang + 55 });
    this.sparks.explode(Math.round(3 + strength * 9), x, y);
    if (tier !== 'light' || Math.random() < 0.35) this.word(tier, x, y);
    if (strength > 0.45 && part === 'head') this.sweat.explode(Math.round(2 + strength * 5), x, y - 20);
    if (strength > 0.7) {
      this.drops.explode(Math.round(4 + strength * 8), x, y);
      this.scene.cameras.main.shake(110, 0.005 + strength * 0.004);
    }
  }

  update(time) {
    const boss = this.boss;
    const head = boss.head;
    // dizzy stars
    const showStars = boss.isStunned();
    this.stars.forEach((s, i) => {
      if (!showStars) { s.setVisible(false); return; }
      const a = time / 260 + (i / this.stars.length) * Math.PI * 2;
      const r = 46, cx = head.x, cy = head.y - 48;
      s.setVisible(true).setPosition(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.3)
        .setScale(0.7 + Math.sin(a) * 0.25).setDepth(Math.sin(a) > 0 ? 40 : 29).setRotation(a);
    });
    // occasional sweat while stunned
    if (showStars && Math.random() < 0.03) this.sweat.explode(1, head.x + Phaser.Math.Between(-30, 30), head.y - 30);
    // shadow follows the torso, smaller when he is high up
    const t = boss.center;
    const h = Phaser.Math.Clamp((FLOOR_Y - t.y) / 500, 0, 1);
    this.shadow.setPosition(t.x, FLOOR_Y + 4).setScale(1.25 - h * 0.6, 1).setAlpha(0.85 - h * 0.6);
  }
}
