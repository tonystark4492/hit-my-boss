// Shape, size and joint data for every ragdoll body part.
// Sizes are in game pixels (game is 1280x720). Texture size (tw/th) is a bit bigger
// than the physics shape so outlines and ears etc. can stick out.

export const PART_TYPES = {
  head:     { shape: 'circle', r: 33, tw: 100, th: 112, density: 0.0012 },
  neck:     { w: 22, h: 26, chamfer: 8,  tw: 30, th: 34, density: 0.0012 },
  torso:    { w: 78, h: 130, chamfer: 20, tw: 100, th: 150, density: 0.0011 },
  upperArm: { w: 24, h: 72, chamfer: 11, tw: 34, th: 82, density: 0.001 },
  lowerArm: { w: 22, h: 64, chamfer: 10, tw: 32, th: 74, density: 0.001 },
  hand:     { w: 26, h: 30, chamfer: 11, tw: 38, th: 40, density: 0.001 },
  upperLeg: { w: 32, h: 86, chamfer: 14, tw: 42, th: 96, density: 0.0011 },
  lowerLeg: { w: 28, h: 84, chamfer: 12, tw: 38, th: 94, density: 0.0011 },
  foot:     { w: 48, h: 18, chamfer: 8,  tw: 58, th: 28, density: 0.0013 }
};

// Each instance: name, type, side (+1 = screen right, -1 = screen left, 0 = centre), draw depth.
export const PARTS = [
  { name: 'torso', type: 'torso', side: 0, depth: 20 },
  { name: 'neck', type: 'neck', side: 0, depth: 18 },
  { name: 'head', type: 'head', side: 0, depth: 30 },
  { name: 'upperArmR', type: 'upperArm', side: 1, depth: 24 },
  { name: 'lowerArmR', type: 'lowerArm', side: 1, depth: 25 },
  { name: 'handR', type: 'hand', side: 1, depth: 26 },
  { name: 'upperArmL', type: 'upperArm', side: -1, depth: 24 },
  { name: 'lowerArmL', type: 'lowerArm', side: -1, depth: 25 },
  { name: 'handL', type: 'hand', side: -1, depth: 26 },
  { name: 'upperLegR', type: 'upperLeg', side: 1, depth: 12 },
  { name: 'lowerLegR', type: 'lowerLeg', side: 1, depth: 11 },
  { name: 'footR', type: 'foot', side: 1, depth: 13 },
  { name: 'upperLegL', type: 'upperLeg', side: -1, depth: 12 },
  { name: 'lowerLegL', type: 'lowerLeg', side: -1, depth: 11 },
  { name: 'footL', type: 'foot', side: -1, depth: 13 }
];

// Joints: parent anchor (local point on parent) is pinned to child anchor (local point on child).
// min/max = allowed angle of child relative to parent (radians). Values for side=-1 are mirrored.
export const JOINTS = [
  { parent: 'torso', child: 'neck', pa: [0, -60], ca: [0, 9], min: -0.45, max: 0.45 },
  { parent: 'neck', child: 'head', pa: [0, -9], ca: [0, 32], min: -0.55, max: 0.55 },
  { parent: 'torso', child: 'upperArmR', pa: [34, -50], ca: [0, -27], min: -3.0, max: 0.9 },
  { parent: 'upperArmR', child: 'lowerArmR', pa: [0, 28], ca: [0, -25], min: -2.7, max: 0.15 },
  { parent: 'lowerArmR', child: 'handR', pa: [0, 27], ca: [0, -10], min: -0.9, max: 0.9 },
  { parent: 'torso', child: 'upperArmL', pa: [-34, -50], ca: [0, -27], min: -3.0, max: 0.9, mirror: true },
  { parent: 'upperArmL', child: 'lowerArmL', pa: [0, 28], ca: [0, -25], min: -2.7, max: 0.15, mirror: true },
  { parent: 'lowerArmL', child: 'handL', pa: [0, 27], ca: [0, -10], min: -0.9, max: 0.9, mirror: true },
  { parent: 'torso', child: 'upperLegR', pa: [22, 52], ca: [0, -31], min: -1.9, max: 0.5 },
  { parent: 'upperLegR', child: 'lowerLegR', pa: [0, 33], ca: [0, -31], min: -0.2, max: 2.5 },
  { parent: 'lowerLegR', child: 'footR', pa: [0, 34], ca: [0, -4], min: -0.5, max: 0.5 },
  { parent: 'torso', child: 'upperLegL', pa: [-22, 52], ca: [0, -31], min: -1.9, max: 0.5, mirror: true },
  { parent: 'upperLegL', child: 'lowerLegL', pa: [0, 33], ca: [0, -31], min: -0.2, max: 2.5, mirror: true },
  { parent: 'lowerLegL', child: 'footL', pa: [0, 34], ca: [0, -4], min: -0.5, max: 0.5, mirror: true }
];

// The smug sitting pose: absolute angles (radians) of each part while the torso is upright.
// Hands behind the head, knees wide apart - peak arrogant boss.
export const SIT_POSE = {
  torso: -0.04, neck: 0, head: 0.06,
  upperArmR: -2.35, lowerArmR: 2.45, handR: 2.45,
  upperArmL: 2.35, lowerArmL: -2.45, handL: -2.45,
  upperLegR: -1.0, lowerLegR: 0.05, footR: 0,
  upperLegL: 1.0, lowerLegL: -0.05, footL: 0
};

// Muscle strength per joint child (how strongly it tries to hold the pose).
export const MUSCLE = {
  neck: 0.35, head: 0.3,
  upperArmR: 0.3, lowerArmR: 0.3, handR: 0.15,
  upperArmL: 0.3, lowerArmL: 0.3, handL: 0.15,
  upperLegR: 0.28, lowerLegR: 0.22, footR: 0.15,
  upperLegL: 0.28, lowerLegL: 0.22, footL: 0.15
};
