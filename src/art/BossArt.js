import { rr, cylGrad, vGrad, radial, ellipse, seeded } from './draw.js';

// Original procedural artwork for the boss. Each function draws one body part,
// centred in a canvas of the part's texture size (see bossDefs.js).

const SKIN = { dark: '#b8714f', mid: '#e9a882', light: '#ffd0ae' };
const SHIRT = { dark: '#6c8fbb', mid: '#a6c3e6', light: '#d5e6f8', line: 'rgba(60,90,130,0.35)' };
const PANTS = { dark: '#16171b', mid: '#2c2e35', light: '#40434c' };

function shirtFill(ctx, x, w) { return cylGrad(ctx, x, w, SHIRT.dark, SHIRT.mid, SHIRT.light); }
function pantsFill(ctx, x, w) { return cylGrad(ctx, x, w, PANTS.dark, PANTS.mid, PANTS.light); }
function skinFill(ctx, x, w) { return cylGrad(ctx, x, w, SKIN.dark, SKIN.mid, SKIN.light); }

function outline(ctx, w = 2) {
  ctx.lineWidth = w; ctx.strokeStyle = 'rgba(25,20,30,0.75)'; ctx.stroke();
}

export function drawHead(ctx, W, H) {
  const cx = W / 2, cy = H / 2 - 2;
  // ears
  [-1, 1].forEach(s => {
    ellipse(ctx, cx + s * 35, cy + 6, 8, 13);
    ctx.fillStyle = SKIN.mid; ctx.fill(); outline(ctx, 1.5);
    ellipse(ctx, cx + s * 35, cy + 6, 4, 8); ctx.fillStyle = 'rgba(150,70,50,0.45)'; ctx.fill();
  });
  // skull
  ellipse(ctx, cx, cy, 36, 46);
  ctx.fillStyle = radial(ctx, cx - 12, cy - 22, 4, 70, [[0, SKIN.light], [0.45, SKIN.mid], [1, SKIN.dark]]);
  ctx.fill(); outline(ctx, 2.2);
  // jaw stubble shadow
  ctx.save(); ellipse(ctx, cx, cy, 36, 46); ctx.clip();
  ctx.fillStyle = 'rgba(90,60,55,0.16)';
  ellipse(ctx, cx, cy + 34, 34, 20); ctx.fill();
  // side fringe hair (bald on top)
  const rnd = seeded(5);
  [-1, 1].forEach(s => {
    for (let i = 0; i < 70; i++) {
      const a = (s > 0 ? 0 : Math.PI) + (rnd() - 0.5) * 0.9 - s * 0.05;
      const r = 30 + rnd() * 7;
      const x = cx + Math.cos(a) * r, y = cy + 2 + Math.sin(a) * 30 + (rnd() - 0.3) * 6;
      ctx.strokeStyle = rnd() > 0.5 ? 'rgba(80,72,70,0.7)' : 'rgba(140,130,125,0.6)';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s * 2, y - 3); ctx.stroke();
    }
  });
  ctx.restore();
  // forehead wrinkles
  ctx.strokeStyle = 'rgba(150,80,60,0.35)'; ctx.lineWidth = 1.3;
  [-22, -16].forEach(dy => { ctx.beginPath(); ctx.arc(cx, cy + dy + 40, 40, -2.05, -1.1); ctx.stroke(); });
  // bald shine
  ctx.save(); ctx.translate(cx - 12, cy - 30); ctx.rotate(-0.45);
  ellipse(ctx, 0, 0, 13, 6); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
  ellipse(ctx, 14, 6, 3, 2); ctx.fill();
  ctx.restore();
}

export function drawNeck(ctx, W, H) {
  rr(ctx, 4, 0, W - 8, H, 6);
  ctx.fillStyle = skinFill(ctx, 4, W - 8); ctx.fill(); outline(ctx, 1.5);
  ctx.fillStyle = 'rgba(120,60,40,0.3)'; ctx.fillRect(4, 0, W - 8, 7);
}

export function drawTorso(ctx, W, H) {
  const cx = W / 2;
  // shirt body with a boss-belly bulge
  ctx.beginPath();
  ctx.moveTo(cx - 30, 10);
  ctx.quadraticCurveTo(cx - 44, 12, cx - 42, 34);
  ctx.quadraticCurveTo(cx - 48, 96, cx - 38, 124);
  ctx.lineTo(cx + 38, 124);
  ctx.quadraticCurveTo(cx + 48, 96, cx + 42, 34);
  ctx.quadraticCurveTo(cx + 44, 12, cx + 30, 10);
  ctx.closePath();
  ctx.fillStyle = shirtFill(ctx, cx - 46, 92); ctx.fill(); outline(ctx);
  // belly highlight & wrinkles
  ctx.save(); ctx.clip();
  ctx.fillStyle = radial(ctx, cx - 6, 92, 2, 40, [[0, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(0, 50, W, 80);
  ctx.strokeStyle = SHIRT.line; ctx.lineWidth = 1.4;
  [[cx - 36, 64, cx - 18, 80], [cx + 34, 70, cx + 16, 86], [cx - 34, 104, cx - 12, 112], [cx + 30, 100, cx + 10, 114], [cx - 40, 30, cx - 26, 44]].forEach(([a, b, c2, d]) => {
    ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo((a + c2) / 2, b + 10, c2, d); ctx.stroke();
  });
  // armpit shading
  ctx.fillStyle = 'rgba(40,60,100,0.25)';
  ellipse(ctx, cx - 40, 36, 8, 18); ctx.fill(); ellipse(ctx, cx + 40, 36, 8, 18); ctx.fill();
  ctx.restore();
  // button placket
  ctx.strokeStyle = SHIRT.line; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(cx + 5, 26); ctx.lineTo(cx + 4, 122); ctx.stroke();
  // chest pocket with pen
  rr(ctx, cx + 12, 38, 20, 22, 3); ctx.strokeStyle = 'rgba(60,90,130,0.55)'; ctx.stroke();
  ctx.fillStyle = '#1d2c6b'; ctx.fillRect(cx + 16, 31, 3, 14);
  ctx.fillStyle = '#c7c9cf'; ctx.fillRect(cx + 16, 31, 3, 3);
  // collar
  ctx.fillStyle = vGrad(ctx, 6, 28, [[0, '#e9f2fb'], [1, '#b5cde8']]);
  ctx.beginPath(); ctx.moveTo(cx - 16, 6); ctx.lineTo(cx - 2, 26); ctx.lineTo(cx - 20, 22); ctx.closePath(); ctx.fill(); outline(ctx, 1.3);
  ctx.beginPath(); ctx.moveTo(cx + 16, 6); ctx.lineTo(cx + 2, 26); ctx.lineTo(cx + 20, 22); ctx.closePath(); ctx.fill(); outline(ctx, 1.3);
  // tie
  ctx.fillStyle = '#121216';
  ctx.beginPath(); ctx.moveTo(cx - 6, 16); ctx.lineTo(cx + 6, 16); ctx.lineTo(cx + 4, 28); ctx.lineTo(cx - 4, 28); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - 4, 28); ctx.lineTo(cx + 4, 28); ctx.lineTo(cx + 11, 100); ctx.lineTo(cx, 112); ctx.lineTo(cx - 10, 100); ctx.closePath();
  ctx.fillStyle = cylGrad(ctx, cx - 11, 22, '#060608', '#1b1b22', '#3a3a46'); ctx.fill(); outline(ctx, 1.2);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 2, 32); ctx.lineTo(cx - 5, 96); ctx.stroke();
  // belt
  ctx.fillStyle = vGrad(ctx, 114, 126, [[0, '#2a1d17'], [1, '#120c09']]);
  ctx.fillRect(cx - 40, 114, 80, 12);
  rr(ctx, cx - 9, 113, 18, 14, 2); ctx.fillStyle = '#c9ccd3'; ctx.fill();
  ctx.fillStyle = '#2a1d17'; ctx.fillRect(cx - 5, 117, 10, 6);
  // trouser top
  ctx.beginPath(); ctx.moveTo(cx - 40, 126); ctx.lineTo(cx + 40, 126); ctx.lineTo(cx + 42, H - 6); ctx.lineTo(cx - 42, H - 6); ctx.closePath();
  ctx.fillStyle = pantsFill(ctx, cx - 42, 84); ctx.fill(); outline(ctx);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.moveTo(cx, 128); ctx.lineTo(cx, H - 8); ctx.stroke();
}

export function drawUpperArm(ctx, W, H) {
  rr(ctx, 3, 2, W - 6, H - 4, 13);
  ctx.fillStyle = shirtFill(ctx, 3, W - 6); ctx.fill(); outline(ctx);
  ctx.strokeStyle = SHIRT.line; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(6, 14); ctx.quadraticCurveTo(W / 2, 20, W - 6, 12); ctx.stroke();
  [56, 64, 70].forEach(y => { ctx.beginPath(); ctx.moveTo(7, y); ctx.quadraticCurveTo(W / 2, y + 4, W - 8, y - 3); ctx.stroke(); });
}

export function drawLowerArm(ctx, W, H) {
  rr(ctx, 3, 2, W - 6, H - 4, 11);
  ctx.fillStyle = shirtFill(ctx, 3, W - 6); ctx.fill(); outline(ctx);
  // cuff
  rr(ctx, 2, H - 20, W - 4, 17, 5);
  ctx.fillStyle = cylGrad(ctx, 2, W - 4, '#86a6cf', '#c4d9f0', '#e6f0fb'); ctx.fill(); outline(ctx, 1.4);
  ctx.fillStyle = '#f4f4f4'; ellipse(ctx, W / 2 + 6, H - 12, 2.2, 2.2); ctx.fill();
  ctx.strokeStyle = SHIRT.line; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(6, 16); ctx.quadraticCurveTo(W / 2, 22, W - 7, 14); ctx.stroke();
}

export function drawHand(ctx, W, H, side) {
  ctx.save();
  if (side < 0) { ctx.translate(W, 0); ctx.scale(-1, 1); }
  // palm
  rr(ctx, 6, 3, W - 12, H - 10, 10);
  ctx.fillStyle = skinFill(ctx, 6, W - 12); ctx.fill(); outline(ctx, 1.6);
  // fingers
  for (let i = 0; i < 4; i++) {
    const fx = 9 + i * 5.5;
    rr(ctx, fx, H - 14, 6, 12, 3); ctx.fillStyle = SKIN.mid; ctx.fill(); outline(ctx, 1.1);
  }
  // thumb
  ctx.save(); ctx.translate(W - 7, 16); ctx.rotate(-0.5);
  rr(ctx, -4, 0, 8, 15, 4); ctx.fillStyle = SKIN.mid; ctx.fill(); outline(ctx, 1.1);
  ctx.restore();
  // knuckle highlights
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 4; i++) { ellipse(ctx, 12 + i * 5.5, H - 16, 2, 1.4); ctx.fill(); }
  ctx.restore();
}

export function drawUpperLeg(ctx, W, H) {
  rr(ctx, 3, 2, W - 6, H - 4, 15);
  ctx.fillStyle = pantsFill(ctx, 3, W - 6); ctx.fill(); outline(ctx);
  // pinstripes
  ctx.save(); rr(ctx, 3, 2, W - 6, H - 4, 15); ctx.clip();
  ctx.strokeStyle = 'rgba(200,200,220,0.08)'; ctx.lineWidth = 1;
  for (let x = 6; x < W; x += 6) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(W / 2 - 2, 6); ctx.lineTo(W / 2 - 2, H - 6); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  [H - 22, H - 14].forEach(y => { ctx.beginPath(); ctx.moveTo(6, y); ctx.quadraticCurveTo(W / 2, y + 5, W - 6, y - 2); ctx.stroke(); });
}

export function drawLowerLeg(ctx, W, H) {
  rr(ctx, 3, 2, W - 6, H - 10, 12);
  ctx.fillStyle = pantsFill(ctx, 3, W - 6); ctx.fill(); outline(ctx);
  ctx.save(); rr(ctx, 3, 2, W - 6, H - 10, 12); ctx.clip();
  ctx.strokeStyle = 'rgba(200,200,220,0.08)'; ctx.lineWidth = 1;
  for (let x = 5; x < W; x += 6) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(W / 2 - 2, 6); ctx.lineTo(W / 2 - 2, H - 12); ctx.stroke();
  // sock
  ctx.fillStyle = '#0d0d10'; ctx.fillRect(8, H - 10, W - 16, 9);
}

export function drawFoot(ctx, W, H) {
  ellipse(ctx, W / 2, H / 2 + 1, W / 2 - 3, H / 2 - 2);
  ctx.fillStyle = radial(ctx, W / 2 - 8, H / 2 - 5, 1, W / 2, [[0, '#5a5a66'], [0.35, '#1b1b21'], [1, '#050506']]);
  ctx.fill(); outline(ctx, 1.6);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ellipse(ctx, W / 2 - 9, H / 2 - 4, 7, 2.2); ctx.fill();
  ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(W / 2, H / 2 + 2, W / 2 - 4, H / 2 - 3, 0, 0.2, Math.PI - 0.2); ctx.stroke();
}

export const PART_DRAWERS = {
  head: drawHead, neck: drawNeck, torso: drawTorso,
  upperArm: drawUpperArm, lowerArm: drawLowerArm, hand: drawHand,
  upperLeg: drawUpperLeg, lowerLeg: drawLowerLeg, foot: drawFoot
};

// ---------------------------------------------------------------- faces
// Face is drawn on a transparent canvas the same size as the head and layered on top.

function eye(ctx, x, y, o) {
  const { open = 1, size = 1, pupil = 1, look = 0, lid = 0 } = o;
  const rx = 8.5 * size, ry = 6.5 * size * open;
  if (open <= 0.05) {
    ctx.strokeStyle = '#2a1a14'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(x, y - 2, 8, 0.3, Math.PI - 0.3); ctx.stroke();
    return;
  }
  ellipse(ctx, x, y, rx, ry); ctx.fillStyle = '#fbfaf6'; ctx.fill();
  ctx.save(); ellipse(ctx, x, y, rx, ry); ctx.clip();
  ellipse(ctx, x + look, y + 0.5, 3.8 * pupil, 3.8 * pupil); ctx.fillStyle = '#4a2f1c'; ctx.fill();
  ellipse(ctx, x + look, y + 0.5, 2 * pupil, 2 * pupil); ctx.fillStyle = '#100a07'; ctx.fill();
  ellipse(ctx, x + look - 1.3, y - 1.3, 1.1, 1.1); ctx.fillStyle = '#fff'; ctx.fill();
  if (lid > 0) { ctx.fillStyle = SKIN.mid; ctx.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, ry * 2 * lid); }
  ctx.restore();
  ellipse(ctx, x, y, rx, ry); ctx.strokeStyle = 'rgba(40,20,15,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
  if (lid > 0) {
    ctx.strokeStyle = '#3a2219'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - rx, y - ry + ry * 2 * lid); ctx.lineTo(x + rx, y - ry + ry * 2 * lid - 1); ctx.stroke();
  }
}

function brow(ctx, x, y, angle, len = 18) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.strokeStyle = '#3f3530'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.quadraticCurveTo(0, -3, len / 2, 0); ctx.stroke();
  ctx.restore();
}

function nose(ctx, cx, y) {
  ctx.fillStyle = radial(ctx, cx - 2, y - 2, 1, 10, [[0, '#ffc6a3'], [1, '#d48a68']]);
  ellipse(ctx, cx, y, 7.5, 6.5); ctx.fill();
  ctx.strokeStyle = 'rgba(120,50,30,0.5)'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(cx - 4, y + 3, 2.5, 0, Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + 4, y + 3, 2.5, 0, Math.PI); ctx.stroke();
}

function cheeks(ctx, cx, cy, alpha) {
  [-1, 1].forEach(s => {
    ctx.fillStyle = radial(ctx, cx + s * 22, cy, 0, 11, [[0, `rgba(230,60,50,${alpha})`], [1, 'rgba(230,60,50,0)']]);
    ellipse(ctx, cx + s * 22, cy, 12, 8); ctx.fill();
  });
}

function mouth(ctx, cx, y, type) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const ink = '#4a1f17';
  switch (type) {
    case 'smirk':
      ctx.strokeStyle = ink; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(cx - 12, y + 1); ctx.quadraticCurveTo(cx + 2, y + 5, cx + 14, y - 5); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx + 12, y - 8); ctx.lineTo(cx + 16, y - 3); ctx.stroke();
      break;
    case 'smile':
      ctx.strokeStyle = ink; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(cx - 12, y - 2); ctx.quadraticCurveTo(cx, y + 7, cx + 12, y - 2); ctx.stroke();
      break;
    case 'o':
      ellipse(ctx, cx, y + 3, 7, 10); ctx.fillStyle = '#3a0f0c'; ctx.fill();
      ellipse(ctx, cx, y + 8, 5, 4); ctx.fillStyle = '#d4545a'; ctx.fill();
      ellipse(ctx, cx, y + 3, 7, 10); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke();
      break;
    case 'grit':
      rr(ctx, cx - 14, y - 6, 28, 13, 4); ctx.fillStyle = '#fbfbf2'; ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx - 14, y); ctx.lineTo(cx + 14, y);
      for (let i = -9; i <= 9; i += 6) { ctx.moveTo(cx + i, y - 6); ctx.lineTo(cx + i, y + 7); }
      ctx.stroke();
      break;
    case 'grimace':
      ctx.beginPath(); ctx.moveTo(cx - 15, y + 2); ctx.quadraticCurveTo(cx - 8, y - 6, cx, y - 2); ctx.quadraticCurveTo(cx + 8, y - 6, cx + 15, y + 2);
      ctx.quadraticCurveTo(cx, y + 12, cx - 15, y + 2); ctx.closePath();
      ctx.fillStyle = '#fbfbf2'; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke();
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 13, y + 2); ctx.lineTo(cx + 13, y + 2); ctx.stroke();
      break;
    case 'wavy':
      ctx.strokeStyle = ink; ctx.lineWidth = 2.4; ctx.beginPath();
      ctx.moveTo(cx - 13, y);
      for (let i = 0; i <= 4; i++) ctx.quadraticCurveTo(cx - 13 + i * 6.5 + 3.25, y + (i % 2 ? 4 : -4), cx - 13 + (i + 1) * 6.5, y);
      ctx.stroke();
      break;
    case 'tongue':
      ctx.beginPath(); ctx.moveTo(cx - 12, y - 2); ctx.quadraticCurveTo(cx, y + 8, cx + 12, y - 2); ctx.quadraticCurveTo(cx, y + 2, cx - 12, y - 2);
      ctx.fillStyle = '#3a0f0c'; ctx.fill();
      ellipse(ctx, cx + 4, y + 7, 5, 6); ctx.fillStyle = '#e0626b'; ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
      break;
    case 'frown':
      ctx.strokeStyle = ink; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(cx - 12, y + 4); ctx.quadraticCurveTo(cx, y - 5, cx + 12, y + 4); ctx.stroke();
      break;
  }
}

function spiral(ctx, x, y) {
  ellipse(ctx, x, y, 9, 9); ctx.fillStyle = '#fbfaf6'; ctx.fill();
  ctx.strokeStyle = '#2a1a14'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let a = 0; a < Math.PI * 5; a += 0.2) {
    const r = a * 0.55;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function squeezed(ctx, x, y, s) {
  ctx.strokeStyle = '#2a1a14'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 8 * s, y - 5); ctx.lineTo(x + 6 * s, y); ctx.lineTo(x - 8 * s, y + 5); ctx.stroke();
}

function angerMark(ctx, x, y) {
  ctx.strokeStyle = '#e0261d'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
    ctx.beginPath(); ctx.moveTo(x + sx * 2, y + sy * 7); ctx.quadraticCurveTo(x + sx * 2, y + sy * 2, x + sx * 7, y + sy * 2); ctx.stroke();
  });
}

function sweatDrop(ctx, x, y) {
  ctx.fillStyle = 'rgba(160,215,255,0.95)';
  ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.quadraticCurveTo(x + 6, y + 2, x, y + 5); ctx.quadraticCurveTo(x - 6, y + 2, x, y - 7); ctx.fill();
  ctx.strokeStyle = 'rgba(40,90,140,0.8)'; ctx.lineWidth = 1; ctx.stroke();
}

export const EXPRESSIONS = ['smug', 'normal', 'blink', 'shocked', 'angry', 'hurt', 'dizzy', 'scared'];

export function drawFace(ctx, W, H, expr) {
  const cx = W / 2, ey = H / 2 + 2, ny = ey + 12, my = ey + 28;
  ctx.clearRect(0, 0, W, H);
  // under-eye bags (overworked boss)
  ctx.strokeStyle = 'rgba(140,70,55,0.35)'; ctx.lineWidth = 1.2;
  [-13, 13].forEach(dx => { ctx.beginPath(); ctx.arc(cx + dx, ey + 3, 9, 0.5, Math.PI - 0.5); ctx.stroke(); });
  switch (expr) {
    case 'smug':
      eye(ctx, cx - 13, ey, { open: 0.85, lid: 0.45, look: 2 }); eye(ctx, cx + 13, ey, { open: 0.85, lid: 0.4, look: 2 });
      brow(ctx, cx - 13, ey - 13, -0.15); brow(ctx, cx + 13, ey - 16, -0.2);
      nose(ctx, cx, ny); mouth(ctx, cx, my, 'smirk');
      break;
    case 'normal':
      eye(ctx, cx - 13, ey, { open: 0.9 }); eye(ctx, cx + 13, ey, { open: 0.9 });
      brow(ctx, cx - 13, ey - 13, 0.05); brow(ctx, cx + 13, ey - 13, -0.05);
      nose(ctx, cx, ny); mouth(ctx, cx, my, 'smile');
      break;
    case 'blink':
      eye(ctx, cx - 13, ey, { open: 0 }); eye(ctx, cx + 13, ey, { open: 0 });
      brow(ctx, cx - 13, ey - 12, -0.1); brow(ctx, cx + 13, ey - 14, -0.15);
      nose(ctx, cx, ny); mouth(ctx, cx, my, 'smirk');
      break;
    case 'shocked':
      eye(ctx, cx - 13, ey - 1, { open: 1.45, size: 1.15, pupil: 0.6 }); eye(ctx, cx + 13, ey - 1, { open: 1.45, size: 1.15, pupil: 0.6 });
      brow(ctx, cx - 14, ey - 20, -0.3); brow(ctx, cx + 14, ey - 20, 0.3);
      nose(ctx, cx, ny + 1); mouth(ctx, cx, my, 'o');
      break;
    case 'angry':
      cheeks(ctx, cx, ey + 12, 0.45);
      eye(ctx, cx - 13, ey + 1, { open: 0.8, lid: 0.3, pupil: 0.9 }); eye(ctx, cx + 13, ey + 1, { open: 0.8, lid: 0.3, pupil: 0.9 });
      brow(ctx, cx - 12, ey - 10, 0.5); brow(ctx, cx + 12, ey - 10, -0.5);
      nose(ctx, cx, ny); mouth(ctx, cx, my, 'grit');
      angerMark(ctx, cx + 22, ey - 32);
      break;
    case 'hurt':
      cheeks(ctx, cx, ey + 12, 0.55);
      squeezed(ctx, cx - 13, ey, 1); squeezed(ctx, cx + 13, ey, -1);
      brow(ctx, cx - 13, ey - 13, -0.45); brow(ctx, cx + 13, ey - 13, 0.45);
      nose(ctx, cx, ny); mouth(ctx, cx, my + 1, 'grimace');
      break;
    case 'dizzy':
      cheeks(ctx, cx, ey + 12, 0.35);
      spiral(ctx, cx - 13, ey); spiral(ctx, cx + 13, ey);
      brow(ctx, cx - 13, ey - 15, -0.3); brow(ctx, cx + 13, ey - 13, 0.1);
      nose(ctx, cx, ny); mouth(ctx, cx, my, 'tongue');
      break;
    case 'scared':
      eye(ctx, cx - 13, ey, { open: 1.3, size: 1.1, pupil: 0.55, look: -1 }); eye(ctx, cx + 13, ey, { open: 1.3, size: 1.1, pupil: 0.55, look: -1 });
      brow(ctx, cx - 13, ey - 17, -0.45); brow(ctx, cx + 13, ey - 17, 0.45);
      nose(ctx, cx, ny); mouth(ctx, cx, my, 'wavy');
      sweatDrop(ctx, cx - 30, ey - 22);
      break;
  }
}

// ---------------------------------------------------------------- damage marks
// marks: [{x, y, r, kind: 'red'|'bruise'|'splat', seed}] in texture-local pixels.
export function drawMarks(ctx, marks) {
  marks.forEach(m => {
    if (m.kind === 'red') {
      ctx.fillStyle = radial(ctx, m.x, m.y, 0, m.r, [[0, 'rgba(225,60,60,0.55)'], [1, 'rgba(225,60,60,0)']]);
      ellipse(ctx, m.x, m.y, m.r, m.r * 0.8); ctx.fill();
    } else if (m.kind === 'bruise') {
      ctx.fillStyle = radial(ctx, m.x, m.y, 0, m.r, [[0, 'rgba(110,40,120,0.7)'], [0.55, 'rgba(150,50,90,0.45)'], [1, 'rgba(200,80,80,0)']]);
      ellipse(ctx, m.x, m.y, m.r, m.r * 0.85); ctx.fill();
    } else if (m.kind === 'splat') {
      const rnd = seeded(m.seed || 1);
      ctx.fillStyle = 'rgba(205,25,35,0.9)';
      ellipse(ctx, m.x, m.y, m.r * 0.45, m.r * 0.4); ctx.fill();
      for (let i = 0; i < 6; i++) {
        const a = rnd() * Math.PI * 2, d = m.r * (0.5 + rnd() * 0.6);
        ellipse(ctx, m.x + Math.cos(a) * d, m.y + Math.sin(a) * d, 1.5 + rnd() * 2.5, 1.5 + rnd() * 2.5); ctx.fill();
      }
    }
  });
}
