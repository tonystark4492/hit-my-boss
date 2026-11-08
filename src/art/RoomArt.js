import { GAME_W, GAME_H } from '../config.js';
import { makeCanvas, rr, vGrad, radial, seeded, ellipse, cylGrad } from './draw.js';

// Procedurally painted meeting room. Everything is original canvas artwork.
// Layers (back to front): sky -> clouds -> skyline -> room (with see-through windows) -> props.

export const WINDOW = { x: 440, y: 92, w: 580, h: 436 };

export function drawSky() {
  const c = makeCanvas(GAME_W, GAME_H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = vGrad(ctx, 60, 540, [
    [0, '#23275a'], [0.35, '#5b4789'], [0.62, '#c86f6a'], [0.8, '#f39a4f'], [1, '#ffd48c']
  ]);
  ctx.fillRect(0, 0, GAME_W, GAME_H);
  // sun glow
  ctx.fillStyle = radial(ctx, 905, 450, 4, 260, [[0, 'rgba(255,240,200,1)'], [0.08, 'rgba(255,214,140,0.9)'], [0.35, 'rgba(255,170,90,0.35)'], [1, 'rgba(255,150,80,0)']]);
  ctx.fillRect(0, 0, GAME_W, GAME_H);
  return c;
}

export function drawClouds() {
  const c = makeCanvas(1024, 200);
  const ctx = c.getContext('2d');
  const rnd = seeded(7);
  for (let i = 0; i < 14; i++) {
    const x = rnd() * 1024, y = 40 + rnd() * 120, s = 30 + rnd() * 60;
    for (let k = 0; k < 6; k++) {
      const px = x + (rnd() - 0.5) * s * 2.6, py = y + (rnd() - 0.5) * s * 0.5;
      ctx.fillStyle = radial(ctx, px, py, 0, s, [[0, 'rgba(255,220,210,0.32)'], [1, 'rgba(255,200,190,0)']]);
      ellipse(ctx, px, py, s * 1.6, s * 0.6); ctx.fill();
      // wrap horizontally so the tile loops seamlessly
      if (px > 900) { ellipse(ctx, px - 1024, py, s * 1.6, s * 0.6); ctx.fill(); }
      if (px < 124) { ellipse(ctx, px + 1024, py, s * 1.6, s * 0.6); ctx.fill(); }
    }
  }
  return c;
}

export function drawSkyline() {
  const c = makeCanvas(GAME_W, GAME_H);
  const ctx = c.getContext('2d');
  const rnd = seeded(42);
  const base = 540;
  // far buildings (hazy)
  let x = 400;
  while (x < 1060) {
    const w = 30 + rnd() * 50, h = 90 + rnd() * 160;
    ctx.fillStyle = 'rgba(120,95,140,0.75)';
    ctx.fillRect(x, base - h - 60, w, h + 60);
    x += w + 2;
  }
  // near buildings with lit windows
  x = 420;
  while (x < 1060) {
    const w = 40 + rnd() * 70, h = 130 + rnd() * 230;
    const top = base - h;
    ctx.fillStyle = vGrad(ctx, top, base, [[0, '#3a3558'], [1, '#1d1b2c']]);
    ctx.fillRect(x, top, w, h);
    if (rnd() > 0.6) { ctx.fillRect(x + w * 0.4, top - 25, 3, 25); }
    // edge highlight from sunset
    ctx.fillStyle = 'rgba(255,170,110,0.25)';
    ctx.fillRect(x + w - 4, top, 4, h);
    for (let wy = top + 8; wy < base - 6; wy += 11) {
      for (let wx = x + 5; wx < x + w - 6; wx += 9) {
        const r = rnd();
        if (r > 0.55) {
          ctx.fillStyle = r > 0.9 ? 'rgba(255,230,160,0.95)' : 'rgba(255,200,120,0.55)';
          ctx.fillRect(wx, wy, 4, 5);
        }
      }
    }
    x += w + 4 + rnd() * 8;
  }
  return c;
}

export function drawRoom() {
  const c = makeCanvas(GAME_W, GAME_H);
  const ctx = c.getContext('2d');
  const rnd = seeded(3);

  // ---- back wall
  ctx.fillStyle = vGrad(ctx, 60, 560, [[0, '#3b3029'], [1, '#55443a']]);
  ctx.fillRect(0, 60, GAME_W, 500);
  // left wood paneling
  for (let px = 0; px < WINDOW.x; px += 44) {
    ctx.fillStyle = cylGrad(ctx, px, 44, '#4a3428', '#6b4a36', '#7d5a42');
    ctx.fillRect(px, 70, 44, 490);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(px + 43, 70, 1.5, 490);
  }
  // right plaster wall
  ctx.fillStyle = vGrad(ctx, 60, 560, [[0, '#5c5450'], [1, '#776d66']]);
  ctx.fillRect(WINDOW.x + WINDOW.w, 60, GAME_W - WINDOW.x - WINDOW.w, 500);

  // ---- ceiling
  ctx.fillStyle = vGrad(ctx, 0, 72, [[0, '#17151a'], [1, '#2a262b']]);
  ctx.fillRect(0, 0, GAME_W, 72);
  ctx.fillStyle = '#0f0e12';
  ctx.fillRect(0, 68, GAME_W, 6);
  for (let lx = 0; lx < GAME_W; lx += 160) {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(lx, 0, 2, 68);
  }

  // ---- window frame (glass area is cut out later so the sky shows through)
  const W = WINDOW;
  ctx.fillStyle = '#1b1a1f';
  ctx.fillRect(W.x - 14, W.y - 14, W.w + 28, W.h + 28);

  // ---- presentation screen on left wall
  rr(ctx, 62, 140, 330, 196, 8); ctx.fillStyle = '#0c0c10'; ctx.fill();
  ctx.fillStyle = vGrad(ctx, 150, 326, [[0, '#1d3557'], [1, '#0f1d33']]);
  ctx.fillRect(74, 152, 306, 172);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
  for (let gy = 180; gy < 320; gy += 28) { ctx.beginPath(); ctx.moveTo(92, gy); ctx.lineTo(366, gy); ctx.stroke(); }
  const bars = [40, 55, 48, 72, 88, 110];
  bars.forEach((b, i) => {
    const bx = 108 + i * 42;
    ctx.fillStyle = vGrad(ctx, 312 - b, 312, [[0, '#7fb3ff'], [1, '#3d6fc2']]);
    ctx.fillRect(bx, 312 - b, 24, b);
  });
  ctx.strokeStyle = '#ff4a3d'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(100, 290); ctx.lineTo(160, 262); ctx.lineTo(200, 275); ctx.lineTo(262, 228); ctx.lineTo(300, 236); ctx.lineTo(350, 180); ctx.stroke();
  ctx.fillStyle = '#ff4a3d';
  ctx.beginPath(); ctx.moveTo(364, 166); ctx.lineTo(338, 176); ctx.lineTo(356, 192); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = 'bold 13px sans-serif';
  ctx.fillText('PROFIT (NOT YOURS)', 92, 172);
  // screen glare
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath(); ctx.moveTo(74, 152); ctx.lineTo(210, 152); ctx.lineTo(120, 324); ctx.lineTo(74, 324); ctx.fill();

  // ---- whiteboard on right wall
  rr(ctx, 1046, 132, 214, 266, 6); ctx.fillStyle = '#b9bcc2'; ctx.fill();
  ctx.fillStyle = vGrad(ctx, 140, 390, [[0, '#fbfbf8'], [1, '#e9e9e4']]);
  ctx.fillRect(1054, 140, 198, 250);
  ctx.fillStyle = '#9da0a6'; ctx.fillRect(1050, 390, 206, 8);
  ctx.fillStyle = '#d63a2f'; ctx.fillRect(1080, 386, 30, 5);
  ctx.fillStyle = '#2b55c4'; ctx.fillRect(1120, 386, 30, 5);
  ctx.save();
  ctx.translate(1068, 178); ctx.rotate(-0.04);
  ctx.fillStyle = '#1f2b44'; ctx.font = 'italic bold 25px "Comic Sans MS", "Segoe Print", cursive';
  ctx.fillText('Q4 Meeting', 0, 0);
  const items = [['Targets', true], ['Deadlines', true], ['More Work!', true], ['Break?', false]];
  ctx.font = 'italic 20px "Comic Sans MS", "Segoe Print", cursive';
  items.forEach(([t, done], i) => {
    const y = 42 + i * 44;
    ctx.strokeStyle = '#1f2b44'; ctx.lineWidth = 2; ctx.strokeRect(0, y - 16, 18, 18);
    if (done) {
      ctx.strokeStyle = '#d63a2f'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(2, y - 8); ctx.lineTo(8, y); ctx.lineTo(20, y - 20); ctx.stroke();
    }
    ctx.fillStyle = '#1f2b44'; ctx.fillText(t, 28, y);
  });
  ctx.strokeStyle = '#d63a2f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(28, 182); ctx.quadraticCurveTo(70, 176, 104, 184); ctx.stroke();
  ctx.restore();

  // ---- baseboard + floor
  ctx.fillStyle = '#1d1714'; ctx.fillRect(0, 552, GAME_W, 10);
  ctx.fillStyle = vGrad(ctx, 560, 720, [[0, '#4e3324'], [0.4, '#3b2619'], [1, '#22150e']]);
  ctx.fillRect(0, 560, GAME_W, 160);
  // perspective plank lines toward a vanishing point
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1.2;
  for (let i = -30; i <= 30; i++) {
    const xTop = 640 + i * 48, xBot = 640 + i * 120;
    ctx.beginPath(); ctx.moveTo(xTop, 562); ctx.lineTo(xBot, 720); ctx.stroke();
  }
  for (let y = 575; y < 720; y += 14 + (y - 560) * 0.18) {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_W, y); ctx.stroke();
  }
  // window light reflected on polished floor
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = vGrad(ctx, 562, 720, [[0, 'rgba(255,170,100,0.30)'], [1, 'rgba(255,150,90,0)']]);
  ctx.beginPath(); ctx.moveTo(W.x, 562); ctx.lineTo(W.x + W.w, 562); ctx.lineTo(W.x + W.w + 160, 720); ctx.lineTo(W.x - 60, 720); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // ---- ceiling lamps (fixtures; glows added as separate animated sprites)
  [300, 640, 980].forEach(lx => {
    ctx.fillStyle = '#0b0b0d'; ctx.fillRect(lx - 2, 0, 4, 34);
    ctx.fillStyle = vGrad(ctx, 32, 52, [[0, '#3a3a40'], [1, '#18181c']]);
    ctx.beginPath(); ctx.moveTo(lx - 34, 52); ctx.lineTo(lx - 18, 32); ctx.lineTo(lx + 18, 32); ctx.lineTo(lx + 34, 52); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff1cc'; ctx.fillRect(lx - 30, 50, 60, 4);
  });

  // ---- projector
  rr(ctx, 520, 72, 62, 24, 5); ctx.fillStyle = '#d9d9dd'; ctx.fill();
  ctx.fillStyle = '#26262b'; ctx.fillRect(546, 62, 6, 12);
  ellipse(ctx, 522, 84, 6, 9); ctx.fillStyle = '#5d7aa8'; ctx.fill();

  // ---- credenza (right) - also a physics platform
  ctx.fillStyle = vGrad(ctx, 520, 640, [[0, '#3a2518'], [1, '#22150d']]);
  ctx.fillRect(1062, 524, 230, 116);
  ctx.fillStyle = vGrad(ctx, 514, 528, [[0, '#7a5038'], [1, '#4a2f20']]);
  ctx.fillRect(1056, 514, 240, 12);
  ctx.fillStyle = 'rgba(255,220,180,0.35)'; ctx.fillRect(1056, 514, 240, 2);
  for (let dx = 1074; dx < 1280; dx += 70) {
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(dx, 538, 62, 92);
    ctx.fillStyle = '#b8a27a'; ctx.fillRect(dx + 54, 576, 3, 18);
  }
  // binders on credenza
  ['#2f4e8a', '#8a2f2f', '#2f6a4a', '#55555c'].forEach((col, i) => {
    ctx.fillStyle = col; ctx.fillRect(1180 + i * 15, 446, 13, 68);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(1182 + i * 15, 470, 9, 12);
  });

  // ---- conference table (left) - also a physics platform
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ellipse(ctx, 170, 640, 200, 14); ctx.fill();
  ctx.fillStyle = vGrad(ctx, 520, 640, [[0, '#b9bcc4'], [1, '#5c5f66']]);
  ctx.beginPath(); ctx.moveTo(240, 522); ctx.lineTo(262, 522); ctx.lineTo(290, 640); ctx.lineTo(250, 640); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(60, 522); ctx.lineTo(82, 522); ctx.lineTo(70, 640); ctx.lineTo(32, 640); ctx.closePath(); ctx.fill();
  ctx.fillStyle = vGrad(ctx, 496, 524, [[0, '#7b4a2c'], [0.25, '#5a3420'], [1, '#2f1a0f']]);
  rr(ctx, -20, 496, 368, 28, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,215,170,0.5)'; ctx.fillRect(-20, 497, 366, 2);
  // documents
  ctx.fillStyle = '#f2efe6'; ctx.save(); ctx.translate(130, 494); ctx.rotate(-0.03); ctx.fillRect(0, -3, 90, 4); ctx.restore();
  ctx.fillStyle = '#e4e0d4'; ctx.fillRect(138, 489, 80, 4);
  // laptop (seen from the back)
  ctx.fillStyle = vGrad(ctx, 430, 496, [[0, '#c6c8cf'], [1, '#8e9199']]);
  ctx.save(); ctx.translate(40, 496); ctx.rotate(-0.12); rr(ctx, 0, -64, 84, 64, 5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ellipse(ctx, 42, -32, 7, 8); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#7d8088'; ctx.fillRect(28, 492, 108, 5);
  // BOSS mug
  ctx.fillStyle = cylGrad(ctx, 252, 40, '#cfcfcf', '#f4f4f4', '#ffffff');
  rr(ctx, 252, 452, 40, 44, 5); ctx.fill();
  ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(294, 472, 11, -1.2, 1.2); ctx.stroke();
  ctx.fillStyle = '#c4231d'; ctx.font = 'bold 12px "Arial Black", Impact, sans-serif'; ctx.fillText('BOSS', 254, 480);
  ctx.fillStyle = '#3b2111'; ellipse(ctx, 272, 454, 18, 3); ctx.fill();

  // ---- warm light shafts from the window
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(255,170,100,0.05)';
  ctx.beginPath(); ctx.moveTo(W.x, W.y); ctx.lineTo(W.x + W.w, W.y); ctx.lineTo(W.x + W.w - 120, 640); ctx.lineTo(W.x - 260, 640); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // ---- cut out window glass panes so the sky/skyline layers show through
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';            // must be opaque, destination-out removes by alpha
  const panes = 3, mull = 12, pw = (W.w - mull * (panes - 1)) / panes;
  for (let i = 0; i < panes; i++) ctx.fillRect(W.x + i * (pw + mull), W.y, pw, W.h);
  ctx.globalCompositeOperation = 'source-over';
  // partially lowered blinds over the glass
  for (let i = 0; i < panes; i++) {
    const bx = W.x + i * (pw + mull), slats = [7, 4, 10][i];
    for (let s = 0; s < slats; s++) {
      const y = W.y + s * 11;
      ctx.fillStyle = vGrad(ctx, y, y + 10, [[0, '#d8d0c4'], [1, '#9c9286']]);
      ctx.fillRect(bx, y, pw, 9);
    }
    ctx.fillStyle = '#6e665d'; ctx.fillRect(bx, W.y + slats * 11 - 2, pw, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.moveTo(bx, W.y + W.h); ctx.lineTo(bx + 70, W.y + slats * 11); ctx.lineTo(bx + 120, W.y + slats * 11); ctx.lineTo(bx + 50, W.y + W.h); ctx.fill();
  }
  // window sill
  ctx.fillStyle = vGrad(ctx, W.y + W.h, W.y + W.h + 16, [[0, '#4b4650'], [1, '#26232a']]);
  ctx.fillRect(W.x - 20, W.y + W.h, W.w + 40, 16);

  rnd();
  return c;
}

export function drawPlant(variant = 0) {
  const c = makeCanvas(170, 260);
  const ctx = c.getContext('2d');
  const rnd = seeded(11 + variant * 5);
  // leaves
  for (let i = 0; i < 26; i++) {
    const a = -Math.PI / 2 + (rnd() - 0.5) * 2.3;
    const len = 60 + rnd() * 80;
    const sx = 85, sy = 190;
    const ex = sx + Math.cos(a) * len, ey = sy + Math.sin(a) * len;
    const g = ctx.createLinearGradient(sx, sy, ex, ey);
    g.addColorStop(0, '#1f4a27'); g.addColorStop(1, rnd() > 0.5 ? '#4f9a4a' : '#3c7f3f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    const nx = -Math.sin(a) * 14, ny = Math.cos(a) * 14;
    ctx.quadraticCurveTo((sx + ex) / 2 + nx, (sy + ey) / 2 + ny, ex, ey);
    ctx.quadraticCurveTo((sx + ex) / 2 - nx, (sy + ey) / 2 - ny, sx, sy);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,255,200,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  }
  // pot
  ctx.fillStyle = cylGrad(ctx, 50, 70, '#1c1c20', '#3a3a42', '#55555f');
  ctx.beginPath(); ctx.moveTo(48, 186); ctx.lineTo(122, 186); ctx.lineTo(114, 258); ctx.lineTo(56, 258); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2a2a30'; ctx.fillRect(44, 182, 82, 10);
  return c;
}
