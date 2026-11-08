import Phaser from 'phaser';
import { bus, EV } from '../core/events.js';

const { Constraint, Body } = Phaser.Physics.Matter.Matter;

const DRAG_START_PX = 12;       // finger must move this far before a press becomes a grab
const TAP_MAX_MS = 280;
const SWIPE_SPEED = 1.1;        // px per ms needed for a swipe to count as a slap

/**
 * Touch + mouse interaction with the boss:
 *  - tap a body part        -> quick slap on that part
 *  - press + drag a part    -> grab him (spring constraint)
 *  - release while moving   -> throw
 *  - fast swipe across him  -> slap in the swipe direction
 */
export class InputController {
  constructor(scene, boss) {
    this.scene = scene;
    this.boss = boss;
    this.press = null;
    this.grab = null;
    this.history = [];
    this.lastSlap = 0;
    this.enabled = true;

    this.ring = scene.add.image(0, 0, 'fx_grab').setDepth(70).setVisible(false);

    const input = scene.input;
    input.on('pointerdown', this.onDown, this);
    input.on('pointermove', this.onMove, this);
    input.on('pointerup', this.onUp, this);
    input.on('pointerupoutside', this.onUp, this);
    input.on('gameout', () => this.onUp(scene.input.activePointer));
  }

  record(p) {
    const now = performance.now();
    this.history.push({ x: p.worldX, y: p.worldY, t: now });
    while (this.history.length && now - this.history[0].t > 120) this.history.shift();
  }

  velocity() {
    const h = this.history;
    if (h.length < 2) return { x: 0, y: 0 };
    const a = h[0], b = h[h.length - 1];
    const dt = Math.max(1, b.t - a.t);
    return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };   // px per ms
  }

  onDown(p) {
    if (!this.enabled || this.press) return;
    this.history = [];
    this.record(p);
    const part = this.boss.partAt(p.worldX, p.worldY);
    this.press = { id: p.id, x: p.worldX, y: p.worldY, t: performance.now(), part };
  }

  onMove(p) {
    if (!this.press || p.id !== this.press.id || !p.isDown) return;
    this.record(p);
    if (this.grab) {
      this.grab.c.pointA.x = p.worldX;
      this.grab.c.pointA.y = p.worldY;
      this.ring.setPosition(p.worldX, p.worldY);
      return;
    }
    const moved = Math.hypot(p.worldX - this.press.x, p.worldY - this.press.y);
    if (this.press.part && moved > DRAG_START_PX) { this.startGrab(p); return; }
    // swipe slap (press started off the boss)
    if (!this.press.part) {
      const v = this.velocity(), speed = Math.hypot(v.x, v.y);
      const now = performance.now();
      if (speed > SWIPE_SPEED && now - this.lastSlap > 160) {
        const part = this.boss.partAt(p.worldX, p.worldY, 6);
        if (part) {
          this.lastSlap = now;
          const strength = Phaser.Math.Clamp((speed - SWIPE_SPEED) / 3 + 0.3, 0.3, 1.05);
          this.boss.hit(part.partName, { x: p.worldX, y: p.worldY }, { x: v.x / speed, y: v.y / speed }, strength, { source: 'slap' });
        }
      }
    }
  }

  onUp(p) {
    if (!this.press || (p && p.id !== this.press.id)) return;
    const press = this.press;
    this.press = null;
    if (this.grab) { this.release(); return; }
    // tap on a body part = quick slap
    if (press.part && performance.now() - press.t < TAP_MAX_MS) {
      const b = press.part.body;
      let dx = b.position.x - press.x, dy = b.position.y - press.y;
      let len = Math.hypot(dx, dy);
      if (len < 8) { dx = Math.random() < 0.5 ? -1 : 1; dy = 0; len = 1; }
      const dir = { x: dx / len, y: dy / len - 0.35 };
      const dl = Math.hypot(dir.x, dir.y);
      this.boss.hit(press.part.partName, { x: press.x, y: press.y }, { x: dir.x / dl, y: dir.y / dl }, 0.32 + Math.random() * 0.28, { source: 'tap' });
    }
  }

  startGrab(p) {
    const part = this.press.part;
    const b = part.body;
    const c = Constraint.create({
      pointA: { x: p.worldX, y: p.worldY },
      bodyB: b,
      pointB: { x: this.press.x - b.position.x, y: this.press.y - b.position.y },
      length: 0, stiffness: 0.16, damping: 0.08, label: 'grab'
    });
    this.scene.matter.world.add(c);
    this.grab = { c, part };
    this.boss.grabbed = part.partName;
    this.ring.setVisible(true).setPosition(p.worldX, p.worldY).setScale(0.6);
    this.scene.tweens.add({ targets: this.ring, scale: 1, duration: 120, ease: 'Back.easeOut' });
    bus.emit(EV.GRAB, { part: part.partName });
  }

  release() {
    const { c, part } = this.grab;
    this.scene.matter.world.remove(c);
    this.grab = null;
    this.boss.grabbed = null;
    this.ring.setVisible(false);
    // throw: carry the finger's velocity into the body (px/ms -> px per physics step)
    const v = this.velocity();
    const k = 16.7 * 0.85;
    const tv = { x: v.x * k, y: v.y * k };
    const speed = Math.hypot(tv.x, tv.y);
    if (speed > 4) {
      const b = part.body;
      Body.setVelocity(b, { x: b.velocity.x * 0.3 + tv.x, y: b.velocity.y * 0.3 + tv.y });
      const torso = this.boss.parts.torso.body;
      if (torso !== b) Body.setVelocity(torso, { x: torso.velocity.x * 0.5 + tv.x * 0.6, y: torso.velocity.y * 0.5 + tv.y * 0.6 });
    }
    bus.emit(EV.RELEASE, { part: part.partName, speed });
  }

  cancel() {
    if (this.grab) this.release();
    this.press = null;
  }
}
