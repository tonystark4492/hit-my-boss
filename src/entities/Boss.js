import Phaser from 'phaser';
import { PART_TYPES, PARTS, JOINTS, SIT_POSE, MUSCLE } from './bossDefs.js';
import { PART_DRAWERS, drawFace, drawMarks, EXPRESSIONS } from '../art/BossArt.js';
import { makeCanvas } from '../art/draw.js';
import { CAT, PHYSICS, FLOOR_Y, CHAIR, CHAIR_X, GAME_W, GAME_H } from '../config.js';
import { bus, EV } from '../core/events.js';

const { Body, Constraint } = Phaser.Physics.Matter.Matter;

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const rot = (x, y, a) => ({ x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) });
const MAX_MARKS = 10;

/**
 * The boss: an "active ragdoll". Body parts are Matter bodies pinned together with
 * constraints. Soft "muscles" try to hold a smug sitting pose; when he gets hit the
 * muscle tone drops and he goes floppy, then slowly recovers.
 */
export class Boss {
  constructor(scene) {
    this.scene = scene;
    this.parts = {};
    this.joints = [];
    this.tone = 1;              // 0 = completely limp, 1 = full pose control
    this.grabbed = null;
    this.damage = 0;            // total damage (for future progression stages)
    this.expr = 'smug';
    this.exprUntil = 0;
    this.nextBlink = 0;
    this.dizzyUntil = 0;
    this.knockedAt = 0;
    this.wasKnocked = false;
    this.stretchFrames = 0;
    this.airTime = 0;
    this.fallSoundAt = 0;

    this.group = scene.matter.world.nextGroup(true); // parts never collide with each other
    this.createTextures();
    this.createParts();
    this.createJoints();
    this.face = scene.add.image(0, 0, 'face_smug').setDepth(31);
    this.pose(true);

    scene.matter.world.on('beforeupdate', this.physicsStep, this);
  }

  // ------------------------------------------------------------ setup
  createTextures() {
    const tex = this.scene.textures;
    this.baseCanvases = {};
    PARTS.forEach(p => {
      const def = PART_TYPES[p.type];
      const base = makeCanvas(def.tw, def.th);
      PART_DRAWERS[p.type](base.getContext('2d'), def.tw, def.th, p.side);
      this.baseCanvases[p.name] = base;
      const key = 'boss_' + p.name;
      if (tex.exists(key)) tex.remove(key);
      const ct = tex.createCanvas(key, def.tw, def.th);
      ct.context.drawImage(base, 0, 0);
      ct.refresh();
    });
    const hd = PART_TYPES.head;
    EXPRESSIONS.forEach(e => {
      const key = 'face_' + e;
      if (tex.exists(key)) return;
      const c = makeCanvas(hd.tw, hd.th);
      drawFace(c.getContext('2d'), hd.tw, hd.th, e);
      tex.addCanvas(key, c);
    });
  }

  createParts() {
    const m = this.scene.matter;
    PARTS.forEach(p => {
      const d = PART_TYPES[p.type];
      const isLeg = /Leg|foot/.test(p.name);
      const opts = {
        density: d.density,
        friction: 0.6,
        frictionStatic: 0.8,
        frictionAir: 0.018,
        restitution: 0.08,
        label: 'boss:' + p.name,
        collisionFilter: {
          group: this.group,
          category: isLeg ? CAT.BOSS_LEG : CAT.BOSS,
          mask: isLeg ? (CAT.WORLD | CAT.PROP) : (CAT.WORLD | CAT.CHAIR | CAT.PROP)
        }
      };
      if (d.shape === 'circle') opts.shape = { type: 'circle', radius: d.r };
      else { opts.shape = { type: 'rectangle', width: d.w, height: d.h }; opts.chamfer = { radius: d.chamfer }; }
      const img = m.add.image(0, 0, 'boss_' + p.name, null, opts);
      img.setDepth(p.depth);
      img.partName = p.name;
      img.body.partName = p.name;
      img.body.bossPart = true;
      this.parts[p.name] = img;
    });
    this.bodies = Object.values(this.parts).map(p => p.body);
  }

  createJoints() {
    JOINTS.forEach(j => {
      const parent = this.parts[j.parent].body, child = this.parts[j.child].body;
      const min = j.mirror ? -j.max : j.min, max = j.mirror ? -j.min : j.max;
      this.joints.push({ ...j, parentBody: parent, childBody: child, min, max, constraint: null });
    });
  }

  // Constraint points are stored in world orientation at creation time, so we (re)build
  // them after every hard re-pose to keep them exact.
  rebuildConstraints() {
    const world = this.scene.matter.world;
    this.joints.forEach(j => {
      if (j.constraint) world.remove(j.constraint);
      const pa = rot(j.pa[0], j.pa[1], j.parentBody.angle);
      const ca = rot(j.ca[0], j.ca[1], j.childBody.angle);
      j.constraint = Constraint.create({
        bodyA: j.parentBody, pointA: pa, bodyB: j.childBody, pointB: ca,
        length: 0, stiffness: 1, damping: 0.08, label: 'joint'
      });
      world.add(j.constraint);
    });
  }

  // Place every part in the sitting pose on the chair.
  pose(first = false) {
    const seatTop = FLOOR_Y - CHAIR.h;
    const torso = this.parts.torso.body;
    const torsoH = PART_TYPES.torso.h;
    const place = (body, x, y, a) => {
      Body.setAngle(body, a);
      Body.setPosition(body, { x, y });
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
    };
    place(torso, CHAIR_X, seatTop - torsoH / 2 - 1, SIT_POSE.torso);
    JOINTS.forEach(j => {
      const parent = this.parts[j.parent].body, child = this.parts[j.child].body;
      const a = SIT_POSE[j.child];
      const pa = rot(j.pa[0], j.pa[1], parent.angle);
      const ca = rot(j.ca[0], j.ca[1], a);
      place(child, parent.position.x + pa.x - ca.x, parent.position.y + pa.y - ca.y, a);
    });
    this.rebuildConstraints();
    this.tone = 1;
    this.expr = 'smug';
    this.exprUntil = 0;
    this.dizzyUntil = 0;
    this.wasKnocked = false;
    this.stretchFrames = 0;
    if (!first) this.clearDamage();
    this.syncVisuals(0);
  }

  // ------------------------------------------------------------ physics
  physicsStep() {
    const now = this.scene.time.now;
    const P = this.parts;
    const torso = P.torso.body;

    // muscle tone recovery
    const lying = Math.abs(wrap(torso.angle)) > 1.0;
    let target = 1;
    if (this.grabbed) target = 0.08;
    else if (lying) target = 0.3;
    // recover slowly (about 2-3 seconds), lose control quickly
    if (target > this.tone) this.tone += (target - this.tone) * 0.012;
    else this.tone = Math.max(target, this.tone - 0.05);

    // joints: pose muscles + hard angle limits
    this.joints.forEach(j => {
      const c = j.childBody, p = j.parentBody;
      const rel = wrap(c.angle - p.angle);
      const relVel = c.angularVelocity - p.angularVelocity;
      const ic = c.inertia, ip = p.inertia;
      const wc = ip / (ic + ip), wp = ic / (ic + ip);
      let corr = 0;
      const k = MUSCLE[j.child] || 0.2;
      if (this.tone > 0.02) {
        const tgt = wrap(SIT_POSE[j.child] - SIT_POSE[j.parent]);
        const err = wrap(rel - tgt);
        corr += (err * k * 0.35 + relVel * 0.35) * this.tone;
      }
      // joint limits (always active, even when limp - keeps the body believable)
      if (rel < j.min) corr += (rel - j.min) * 0.5 + Math.min(0, relVel) * 0.6;
      else if (rel > j.max) corr += (rel - j.max) * 0.5 + Math.max(0, relVel) * 0.6;
      if (corr !== 0) {
        Body.setAngularVelocity(c, c.angularVelocity - corr * wc);
        Body.setAngularVelocity(p, p.angularVelocity + corr * wp);
      }
    });

    // keep the torso upright while he has some control
    if (this.tone > 0.55 && !this.grabbed) {
      const err = wrap(torso.angle - SIT_POSE.torso);
      if (Math.abs(err) < 1.2) {
        Body.setAngularVelocity(torso, torso.angularVelocity - (err * 0.06 + torso.angularVelocity * 0.25) * this.tone);
      }
    }
    // neck + head balance (an inverted pendulum - needs extra help to stay up)
    if (this.tone > 0.2) {
      ['neck', 'head'].forEach(n => {
        const b = P[n].body;
        const want = torso.angle + (SIT_POSE[n] - SIT_POSE.torso);
        const err = wrap(b.angle - want);
        Body.setAngularVelocity(b, b.angularVelocity - (err * 0.12 + (b.angularVelocity - torso.angularVelocity) * 0.3) * this.tone);
      });
    }

    // speed caps - stop the solver from exploding on violent throws
    let maxSpeed = 0;
    this.bodies.forEach(b => {
      const v = b.velocity, s = Math.hypot(v.x, v.y);
      maxSpeed = Math.max(maxSpeed, s);
      if (s > PHYSICS.maxPartSpeed) Body.setVelocity(b, { x: v.x / s * PHYSICS.maxPartSpeed, y: v.y / s * PHYSICS.maxPartSpeed });
      if (Math.abs(b.angularVelocity) > PHYSICS.maxAngularSpeed) Body.setAngularVelocity(b, Math.sign(b.angularVelocity) * PHYSICS.maxAngularSpeed);
    });

    // flying / falling detection (for the cartoon falling whistle)
    const tv = torso.velocity;
    if (!this.grabbed && torso.position.y < FLOOR_Y - 200 && tv.y > 6) this.airTime++;
    else this.airTime = 0;
    if (this.airTime === 8 && now - this.fallSoundAt > 1500) {
      this.fallSoundAt = now;
      bus.emit(EV.BOSS_MOOD, { mood: 'falling' });
    }

    // recovered after a knock-down? get angry
    if (this.wasKnocked && this.tone > 0.85 && !lying && now - this.knockedAt > 1500) {
      this.wasKnocked = false;
      this.setExpression('angry', 2200);
      bus.emit(EV.BOSS_MOOD, { mood: 'angry' });
    }

    this.safetyChecks();
  }

  safetyChecks() {
    const t = this.parts.torso.body.position;
    const bad = !Number.isFinite(t.x) || !Number.isFinite(t.y) ||
      t.x < -150 || t.x > GAME_W + 150 || t.y < -400 || t.y > GAME_H + 150;
    // joints pulled far apart for too long = solver trouble -> snap back
    let stretched = false;
    this.joints.forEach(j => {
      const a = Constraint.pointAWorld(j.constraint), b = Constraint.pointBWorld(j.constraint);
      if (Math.hypot(a.x - b.x, a.y - b.y) > 38) stretched = true;
    });
    this.stretchFrames = stretched ? this.stretchFrames + 1 : 0;
    if (bad || this.stretchFrames > 45) {
      console.warn('[Boss] safety reset', { bad, stretch: this.stretchFrames });
      this.scene.events.emit('boss-safety-reset');
    }
  }

  // ------------------------------------------------------------ hits & damage
  /**
   * Apply a hit. strength: 0..1.2 (light < 0.35 < medium < 0.7 < heavy).
   * dir: normalised direction of the blow. push: whether to add an impulse (false for collisions).
   */
  hit(partName, point, dir, strength, { push = true, source = 'punch' } = {}) {
    const part = this.parts[partName];
    if (!part) return;
    const b = part.body;
    strength = Phaser.Math.Clamp(strength, 0, 1.25);

    if (push) {
      const dv = 6 + 24 * strength;
      const kick = (body, f) => Body.setVelocity(body, { x: body.velocity.x + dir.x * dv * f, y: body.velocity.y + dir.y * dv * f });
      kick(b, 1);
      // spread through the connected skeleton so the whole body reacts, not just one limb
      this.joints.forEach(j => {
        if (j.childBody === b) kick(j.parentBody, 0.45);
        if (j.parentBody === b) kick(j.childBody, 0.45);
      });
      if (b !== this.parts.torso.body) kick(this.parts.torso.body, 0.15 + 0.45 * strength);
      const off = { x: point.x - b.position.x, y: point.y - b.position.y };
      const spin = (off.x * dir.y - off.y * dir.x) * 0.004 * strength;
      Body.setAngularVelocity(b, b.angularVelocity + Phaser.Math.Clamp(spin, -0.4, 0.4));
    }

    // muscles give way - bigger hits make him floppier for longer
    this.tone = Math.max(0, this.tone - (0.25 + strength * 0.9));
    if (strength > 0.55) { this.wasKnocked = true; this.knockedAt = this.scene.time.now; }
    if (strength > 0.8) this.dizzyUntil = this.scene.time.now + 2600;

    this.damage += strength * 10;
    this.addMark(partName, point, strength);

    // expression
    const exprs = strength < 0.35 ? ['shocked', 'angry'] : strength < 0.7 ? ['shocked', 'hurt'] : ['hurt', 'dizzy'];
    this.setExpression(Phaser.Utils.Array.GetRandom(exprs), 500 + strength * 900);

    bus.emit(EV.HIT, { part: partName, strength, x: point.x, y: point.y, dir, source });
  }

  addMark(partName, point, strength) {
    if (strength < 0.18) return;
    const part = this.parts[partName];
    const def = PART_TYPES[PARTS.find(p => p.name === partName).type];
    const b = part.body;
    const local = rot(point.x - b.position.x, point.y - b.position.y, -b.angle);
    // keep marks on the visible part of the texture
    const x = Phaser.Math.Clamp(local.x + def.tw / 2, 8, def.tw - 8);
    const y = Phaser.Math.Clamp(local.y + def.th / 2, 8, def.th - 8);
    if (!part.marks) part.marks = [];
    const kind = strength > 0.75 ? 'splat' : strength > 0.4 ? 'bruise' : 'red';
    const r = (partName === 'head' || partName === 'torso' ? 9 : 6) + strength * 8;
    part.marks.push({ x, y, r, kind, seed: Math.floor(Math.random() * 9999) });
    if (kind === 'splat') part.marks.push({ x: x + 3, y: y - 2, r: r * 0.9, kind: 'bruise' });
    if (part.marks.length > MAX_MARKS) part.marks.splice(0, part.marks.length - MAX_MARKS);
    this.redrawPart(partName);
  }

  redrawPart(name) {
    const ct = this.scene.textures.get('boss_' + name);
    const ctx = ct.context;
    ctx.clearRect(0, 0, ct.width, ct.height);
    ctx.drawImage(this.baseCanvases[name], 0, 0);
    const marks = this.parts[name].marks || [];
    if (marks.length) {
      // only paint marks where the part is actually drawn
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      drawMarks(ctx, marks);
      ctx.restore();
    }
    ct.refresh();
  }

  clearDamage() {
    this.damage = 0;
    Object.keys(this.parts).forEach(n => {
      if (this.parts[n].marks && this.parts[n].marks.length) { this.parts[n].marks = []; this.redrawPart(n); }
    });
  }

  setExpression(e, ms) {
    this.expr = e;
    this.exprUntil = this.scene.time.now + ms;
  }

  // ------------------------------------------------------------ helpers
  partAt(x, y, tolerance = 26) {
    const Query = Phaser.Physics.Matter.Matter.Query;
    const hits = Query.point(this.bodies, { x, y });
    if (hits.length) {
      // prefer the part drawn on top
      hits.sort((a, b) => this.parts[b.partName].depth - this.parts[a.partName].depth);
      return this.parts[hits[0].partName];
    }
    let best = null, bestD = tolerance;
    this.bodies.forEach(b => {
      const r = Math.max(b.bounds.max.x - b.bounds.min.x, b.bounds.max.y - b.bounds.min.y) / 2;
      const d = Math.hypot(b.position.x - x, b.position.y - y) - r * 0.8;
      if (d < bestD) { bestD = d; best = this.parts[b.partName]; }
    });
    return best;
  }

  get center() { return this.parts.torso.body.position; }
  get head() { return this.parts.head; }

  isStunned() { return this.scene.time.now < this.dizzyUntil; }

  // ------------------------------------------------------------ visuals per frame
  syncVisuals(time) {
    const head = this.parts.head;
    const now = this.scene.time.now;
    // automatic expression when no timed one is active
    if (now > this.exprUntil) {
      const tv = this.parts.torso.body.velocity;
      const speed = Math.hypot(tv.x, tv.y);
      if (this.grabbed) this.expr = 'scared';
      else if (speed > 11) this.expr = 'shocked';
      else if (this.isStunned()) this.expr = 'dizzy';
      else if (this.tone < 0.35) this.expr = 'hurt';
      else this.expr = 'smug';
      // blinking
      if (this.expr === 'smug') {
        if (now > this.nextBlink) { this.nextBlink = now + 2000 + Math.random() * 3500; this.blinkUntil = now + 130; }
        if (now < (this.blinkUntil || 0)) this.expr = 'blink';
      }
    }
    this.face.setTexture('face_' + this.expr);
    this.face.setPosition(head.x, head.y).setRotation(head.rotation);
    // subtle breathing
    const breath = this.tone > 0.5 ? Math.sin(time / 650) * 0.012 : 0;
    this.parts.torso.setScale(1 + breath * 0.5, 1 + breath);
  }

  destroy() {
    this.scene.matter.world.off('beforeupdate', this.physicsStep, this);
  }
}
