import Phaser from 'phaser';

// Global event bus so UI, audio and game systems stay decoupled.
export const bus = new Phaser.Events.EventEmitter();

export const EV = {
  HIT: 'hit',                 // {part, strength, x, y, source}
  RESET: 'reset',
  PAUSE: 'pause',
  RESUME: 'resume',
  PUNCH_REQUEST: 'punch-request',
  GRAB: 'grab',
  RELEASE: 'release',
  BOSS_MOOD: 'boss-mood'
};
