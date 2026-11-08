import Phaser from 'phaser';
import { drawSky, drawClouds, drawSkyline, drawRoom, drawPlant } from '../art/RoomArt.js';
import {
  drawFlash, drawSoft, drawDrop, drawStar, drawStreak, drawWord, WORDS, WORD_PALETTES,
  drawFist, drawShadow, drawGlow, drawBeam, drawGrabRing, drawChair
} from '../art/FxArt.js';

// Paints all procedural textures once at start-up, then launches the game.
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const add = (key, canvas) => { if (!this.textures.exists(key)) this.textures.addCanvas(key, canvas); };
    add('sky', drawSky());
    add('clouds', drawClouds());
    add('skyline', drawSkyline());
    add('room', drawRoom());
    add('plant0', drawPlant(0));
    add('plant1', drawPlant(1));
    add('chair', drawChair());
    add('fx_flash', drawFlash());
    add('fx_soft', drawSoft());
    add('fx_drop_red', drawDrop('#e0262f', '#7a0b10'));
    add('fx_drop_sweat', drawDrop('rgba(170,220,255,0.95)', '#2d6aa0'));
    add('fx_star', drawStar());
    add('fx_streak', drawStreak());
    add('fx_shadow', drawShadow());
    add('fx_glow', drawGlow());
    add('fx_beam', drawBeam());
    add('fx_grab', drawGrabRing());
    add('fist', drawFist());
    Object.entries(WORDS).forEach(([tier, words]) => words.forEach(w => add('word_' + w, drawWord(w, WORD_PALETTES[tier]))));
    this.scene.start('Game');
  }
}
