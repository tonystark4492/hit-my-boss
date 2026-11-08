import Phaser from 'phaser';
import { bus, EV } from '../core/events.js';
import { audio } from '../audio/AudioManager.js';
import { HIT } from '../config.js';

/**
 * Connects game events to sound + visual feedback, and turns physical collisions
 * (boss slamming into floor, walls, furniture) into damage based on impact speed.
 */
export class Reactions {
  constructor(scene, boss, effects) {
    this.scene = scene;
    this.boss = boss;
    this.effects = effects;
    this.lastVoice = 0;
    this.lastImpact = {};

    bus.on(EV.HIT, this.onHit, this);
    bus.on(EV.BOSS_MOOD, this.onMood, this);
    bus.on(EV.GRAB, this.onGrab, this);
    bus.on(EV.RELEASE, this.onRelease, this);
    scene.matter.world.on('collisionstart', this.onCollision, this);
  }

  voice(name, chance = 1, gap = 450) {
    const now = this.scene.time.now;
    if (now - this.lastVoice < gap || Math.random() > chance) return;
    this.lastVoice = now;
    audio.play(name, { pitchVar: 0.08 });
  }

  onHit(e) {
    const s = e.strength;
    this.effects.impact(e);
    if (e.source === 'impact') {
      audio.play('thud', { volume: Phaser.Math.Clamp(0.35 + s, 0.3, 1), pitchVar: 0.08, minGap: 0.07 });
      if (s > 0.6) audio.play('heavy', { volume: 0.5 });
      if (s > 0.45) this.voice('grunt', 0.7);
      return;
    }
    if (s < 0.35) {
      audio.play('light', { volume: 0.8 });
      this.voice(Math.random() < 0.6 ? 'grunt' : 'shocked', 0.35);
    } else if (s < 0.7) {
      audio.play(e.part === 'head' && Math.random() < 0.45 ? 'bonk' : 'punch', { volume: 0.95 });
      this.voice(Math.random() < 0.55 ? 'grunt' : 'shocked', 0.7);
    } else {
      audio.play('heavy', { volume: 1 });
      if (e.part === 'head') audio.play('bonk', { volume: 0.5, pitch: 0.8 });
      this.voice(Math.random() < 0.5 ? 'shocked' : 'grunt', 0.95, 300);
    }
  }

  onMood({ mood }) {
    if (mood === 'angry') this.voice('angry', 1, 200);
    else if (mood === 'falling') audio.play('fall', { volume: 0.8, pitchVar: 0.03 });
  }

  onGrab() {
    this.voice(Math.random() < 0.5 ? 'shocked' : 'grunt', 0.8, 300);
  }

  onRelease({ speed }) {
    if (speed > 14) { audio.play('whoosh', { volume: 0.8, pitch: 0.8 }); this.boss.setExpression('shocked', 700); }
  }

  onCollision(event) {
    const now = this.scene.time.now;
    for (const pair of event.pairs) {
      const a = pair.bodyA, b = pair.bodyB;
      const bossBody = a.bossPart ? a : b.bossPart ? b : null;
      const other = bossBody === a ? b : a;
      if (!bossBody || other.bossPart) continue;
      const n = pair.collision.normal;
      const rv = { x: bossBody.velocity.x - other.velocity.x, y: bossBody.velocity.y - other.velocity.y };
      const impact = Math.abs(rv.x * n.x + rv.y * n.y);
      if (impact < HIT.impactSoft) continue;
      const key = bossBody.partName;
      if (now - (this.lastImpact[key] || 0) < 150) continue;
      this.lastImpact[key] = now;
      const strength = Phaser.Math.Clamp((impact - HIT.impactSoft) / (HIT.impactHard - HIT.impactSoft), 0, 1.15);
      const sup = pair.collision.supports && pair.collision.supports[0];
      const point = sup ? { x: sup.x, y: sup.y } : { x: bossBody.position.x, y: bossBody.position.y };
      if (strength < 0.12) {
        audio.play('thud', { volume: 0.25, pitch: 1.3, minGap: 0.08 });
        continue;
      }
      this.boss.hit(key, point, { x: -n.x, y: -n.y }, strength, { push: false, source: 'impact' });
    }
  }

  destroy() {
    bus.off(EV.HIT, this.onHit, this);
    bus.off(EV.BOSS_MOOD, this.onMood, this);
    bus.off(EV.GRAB, this.onGrab, this);
    bus.off(EV.RELEASE, this.onRelease, this);
  }
}
