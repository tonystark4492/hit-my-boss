import { CAT, CHAIR, CHAIR_X, FLOOR_Y } from '../config.js';
import Phaser from 'phaser';

const { Body } = Phaser.Physics.Matter.Matter;

// Rolling executive chair. Body = seat + base box; the tall backrest is visual only.
export class Chair {
  constructor(scene) {
    this.scene = scene;
    this.sprite = scene.matter.add.image(CHAIR_X, FLOOR_Y - CHAIR.h / 2, 'chair', null, {
      shape: { type: 'rectangle', width: CHAIR.w, height: CHAIR.h },
      chamfer: { radius: 8 },
      density: 0.0025,
      friction: 0.02,          // wheels: rolls easily
      frictionStatic: 0.05,
      frictionAir: 0.025,
      restitution: 0.15,
      label: 'chair',
      collisionFilter: { category: CAT.CHAIR, mask: CAT.WORLD | CAT.BOSS | CAT.PROP }
    });
    Body.setInertia(this.sprite.body, Infinity);   // stays upright like a real chair on wheels
    this.sprite.setDepth(6);
  }

  reset() {
    const b = this.sprite.body;
    Body.setPosition(b, { x: CHAIR_X, y: FLOOR_Y - CHAIR.h / 2 });
    Body.setVelocity(b, { x: 0, y: 0 });
    Body.setAngle(b, 0);
  }
}
