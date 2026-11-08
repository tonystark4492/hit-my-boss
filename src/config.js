// Central place for tunable numbers. Change values here instead of hunting through code.
export const GAME_W = 1280;
export const GAME_H = 720;

export const FLOOR_Y = 640;          // top surface of the floor
export const CHAIR_X = 640;

export const PHYSICS = {
  gravityY: 1.35,
  maxPartSpeed: 42,                  // px per physics step, stops the ragdoll exploding
  maxAngularSpeed: 0.6
};

// Collision categories (bit flags)
export const CAT = {
  WORLD: 0x0001,
  BOSS: 0x0002,      // head, torso, arms
  BOSS_LEG: 0x0010,  // legs + feet (do not collide with the chair so he can sit naturally)
  CHAIR: 0x0004,
  PROP: 0x0008
};

export const CHAIR = { w: 150, h: 100, texW: 240, texH: 580 };

export const HIT = {
  punchCooldownMs: 110,              // minimum time between punch-button punches
  chainWindowMs: 650,                // quick punches inside this window build power
  impactSoft: 3.5,                   // collision speeds (px/step) that count as impacts
  impactHard: 18
};

export const STORAGE_KEY = 'hitmyboss.v1';

// Want your own soundtrack? Put the file in public/audio/ and set e.g. 'audio/music_game.mp3'.
// Leave null to use the built-in procedural funk loop.
export const CUSTOM_MUSIC_FILE = null;
