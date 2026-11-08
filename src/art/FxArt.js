import { makeCanvas, rr, cylGrad, vGrad, radial, ellipse } from './draw.js';
import { CHAIR } from '../config.js';

function starPath(ctx, cx, cy, spikes, rOut, rIn, jitter = 0, rnd = Math.random) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = (i % 2 ? rIn : rOut) * (1 + (rnd() - 0.5) * jitter);
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

export function drawFlash() {
  const c = makeCanvas(160, 160), ctx = c.getContext('2d');
  ctx.fillStyle = radial(ctx, 80, 80, 0, 80, [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,240,170,0.9)'], [1, 'rgba(255,200,80,0)']]);
  starPath(ctx, 80, 80, 12, 78, 30, 0.5); ctx.fill();
  return c;
}

export function drawSoft() {
  const c = makeCanvas(48, 48), ctx = c.getContext('2d');
  ctx.fillStyle = radial(ctx, 24, 24, 0, 24, [[0, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(0, 0, 48, 48);
  return c;
}

export function drawDrop(color, stroke) {
  const c = makeCanvas(20, 26), ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(10, 1); ctx.quadraticCurveTo(19, 14, 10, 24); ctx.quadraticCurveTo(1, 14, 10, 1); ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ellipse(ctx, 7.5, 13, 2, 3); ctx.fill();
  return c;
}

export function drawStar() {
  const c = makeCanvas(32, 32), ctx = c.getContext('2d');
  starPath(ctx, 16, 16, 5, 15, 6.5);
  ctx.fillStyle = vGrad(ctx, 0, 32, [[0, '#fff6a8'], [1, '#ffbf1f']]); ctx.fill();
  ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 1.5; ctx.stroke();
  return c;
}

export function drawStreak() {
  const c = makeCanvas(40, 8), ctx = c.getContext('2d');
  ctx.fillStyle = vGrad(ctx, 0, 8, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,250,220,1)'], [1, 'rgba(255,255,255,0)']]);
  ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(40, 1); ctx.lineTo(40, 7); ctx.closePath(); ctx.fill();
  return c;
}

export const WORDS = {
  light: ['SLAP!', 'BOP!', 'TAP!'],
  medium: ['POW!', 'BONK!', 'SMACK!'],
  heavy: ['WHAM!', 'KAPOW!', 'CRUNCH!'],
  impact: ['THUD!', 'OOF!', 'BAM!']
};

export function drawWord(text, palette) {
  const c = makeCanvas(260, 150), ctx = c.getContext('2d');
  let s = 1;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  ctx.fillStyle = palette.burstOuter;
  starPath(ctx, 130, 75, 14, 72, 48, 0.35, rnd); ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#1a0d08'; ctx.stroke();
  ctx.fillStyle = palette.burstInner;
  starPath(ctx, 130, 75, 14, 56, 38, 0.3, rnd); ctx.fill();
  ctx.save(); ctx.translate(130, 80); ctx.rotate(-0.12); ctx.transform(1, 0, -0.15, 1, 0, 0);
  const size = text.length > 6 ? 36 : 44;
  ctx.font = `900 ${size}px Impact, "Arial Black", "Roboto Condensed", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = '#1a0d08'; ctx.strokeText(text, 0, 0);
  const g = ctx.createLinearGradient(0, -22, 0, 22); g.addColorStop(0, palette.textTop); g.addColorStop(1, palette.textBot);
  ctx.fillStyle = g; ctx.fillText(text, 0, 0);
  ctx.restore();
  return c;
}

export const WORD_PALETTES = {
  light: { burstOuter: '#ffffff', burstInner: '#8fd3ff', textTop: '#ffffff', textBot: '#cfe8ff' },
  medium: { burstOuter: '#ffd23a', burstInner: '#ff7a1a', textTop: '#fff7b0', textBot: '#ffd02a' },
  heavy: { burstOuter: '#ff2d2d', burstInner: '#ffb21a', textTop: '#ffffff', textBot: '#ffe14a' },
  impact: { burstOuter: '#c7b8ff', burstInner: '#7a4dff', textTop: '#ffffff', textBot: '#e0d4ff' }
};

// The player's punching fist (seen from behind/side), pointing left toward the boss.
export function drawFist() {
  const c = makeCanvas(300, 150), ctx = c.getContext('2d');
  // sleeve
  ctx.fillStyle = cylGrad(ctx, 0, 0, '#111', '#222', '#333');
  const sg = ctx.createLinearGradient(0, 40, 0, 140); sg.addColorStop(0, '#3a3740'); sg.addColorStop(0.5, '#1e1c22'); sg.addColorStop(1, '#0c0b0e');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.moveTo(150, 52); ctx.lineTo(300, 40); ctx.lineTo(300, 140); ctx.lineTo(150, 112); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3; ctx.stroke();
  // wrist
  ctx.fillStyle = vGrad(ctx, 55, 110, [[0, '#ffcfa9'], [1, '#c98060']]);
  rr(ctx, 120, 56, 44, 54, 12); ctx.fill();
  // fist
  rr(ctx, 30, 36, 112, 86, 32);
  ctx.fillStyle = radial(ctx, 70, 60, 5, 90, [[0, '#ffd8b8'], [0.5, '#f0aa82'], [1, '#b8694a']]);
  ctx.fill(); ctx.strokeStyle = '#3a1d12'; ctx.lineWidth = 3.5; ctx.stroke();
  // finger lines + knuckles
  ctx.strokeStyle = 'rgba(90,40,25,0.75)'; ctx.lineWidth = 2.5;
  [58, 78, 98].forEach(y => { ctx.beginPath(); ctx.moveTo(34, y); ctx.quadraticCurveTo(60, y + 4, 86, y); ctx.stroke(); });
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  [48, 68, 88, 106].forEach(y => { ellipse(ctx, 42, y, 7, 5); ctx.fill(); });
  // thumb
  ctx.fillStyle = radial(ctx, 95, 100, 2, 40, [[0, '#ffcfa9'], [1, '#c98060']]);
  ctx.beginPath(); ctx.moveTo(60, 110); ctx.quadraticCurveTo(100, 128, 132, 100); ctx.quadraticCurveTo(110, 96, 70, 100); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a1d12'; ctx.lineWidth = 2.5; ctx.stroke();
  // speed lines
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  [[180, 30, 250, 24], [190, 140, 270, 146], [200, 20, 230, 18]].forEach(([a, b, c2, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c2, d); ctx.stroke(); });
  return c;
}

export function drawShadow() {
  const c = makeCanvas(256, 48), ctx = c.getContext('2d');
  ctx.fillStyle = radial(ctx, 128, 24, 0, 128, [[0, 'rgba(0,0,0,0.55)'], [0.6, 'rgba(0,0,0,0.25)'], [1, 'rgba(0,0,0,0)']]);
  ctx.save(); ctx.scale(1, 0.1875); ctx.beginPath(); ctx.arc(128, 128, 128, 0, Math.PI * 2); ctx.restore(); ctx.fill();
  return c;
}

export function drawGlow() {
  const c = makeCanvas(256, 256), ctx = c.getContext('2d');
  ctx.fillStyle = radial(ctx, 128, 128, 0, 128, [[0, 'rgba(255,230,180,0.55)'], [0.4, 'rgba(255,200,130,0.16)'], [1, 'rgba(255,190,120,0)']]);
  ctx.fillRect(0, 0, 256, 256);
  return c;
}

export function drawBeam() {
  const c = makeCanvas(320, 200), ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(320, 0, 0, 200);
  g.addColorStop(0, 'rgba(200,220,255,0.35)'); g.addColorStop(1, 'rgba(200,220,255,0.02)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(318, 4); ctx.lineTo(0, 76); ctx.lineTo(0, 196); ctx.lineTo(318, 12); ctx.closePath(); ctx.fill();
  return c;
}

export function drawGrabRing() {
  const c = makeCanvas(64, 64), ctx = c.getContext('2d');
  ctx.strokeStyle = 'rgba(255,140,40,0.95)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(32, 32, 24, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(32, 32, 28, 0, Math.PI * 2); ctx.stroke();
  return c;
}

// Executive office chair. The physics body is a CHAIR.w x CHAIR.h box centred in this texture;
// backrest is drawn above it (visual only, sits behind the boss).
export function drawChair() {
  const W = CHAIR.texW, H = CHAIR.texH, ctx = (makeCanvas(W, H)).getContext('2d');
  const c = ctx.canvas;
  const seatTop = H / 2 - CHAIR.h / 2;          // 240
  const floor = H / 2 + CHAIR.h / 2;            // 340
  const cx = W / 2;
  const leather = (x, w) => cylGrad(ctx, x, w, '#3b1d10', '#7a3e22', '#a8623a');
  // backrest
  rr(ctx, cx - 92, 6, 184, seatTop + 20, 46);
  ctx.fillStyle = leather(cx - 92, 184); ctx.fill();
  ctx.strokeStyle = '#1e0e07'; ctx.lineWidth = 3; ctx.stroke();
  // tufting
  ctx.strokeStyle = 'rgba(30,12,5,0.55)'; ctx.lineWidth = 2;
  for (let y = 50; y < seatTop; y += 46) {
    ctx.beginPath(); ctx.moveTo(cx - 80, y); ctx.quadraticCurveTo(cx, y + 8, cx + 80, y); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,220,180,0.18)';
  rr(ctx, cx - 60, 16, 50, seatTop - 30, 24); ctx.fill();
  // armrests
  [-1, 1].forEach(s => {
    const ax = cx + s * 100;
    ctx.fillStyle = '#9ea2aa'; ctx.fillRect(ax - 4, seatTop - 30, 8, 40);
    rr(ctx, ax - 16, seatTop - 44, 32, 16, 7); ctx.fillStyle = '#26160f'; ctx.fill();
  });
  // seat cushion
  rr(ctx, cx - 104, seatTop - 8, 208, 34, 14);
  ctx.fillStyle = vGrad(ctx, seatTop - 8, seatTop + 26, [[0, '#a8623a'], [0.5, '#6e371d'], [1, '#3b1d10']]); ctx.fill();
  ctx.strokeStyle = '#1e0e07'; ctx.lineWidth = 3; ctx.stroke();
  // gas lift
  ctx.fillStyle = cylGrad(ctx, cx - 9, 18, '#5d6068', '#c8cbd2', '#ffffff');
  ctx.fillRect(cx - 9, seatTop + 26, 18, 50);
  // star base
  ctx.fillStyle = vGrad(ctx, floor - 30, floor - 16, [[0, '#d3d6dc'], [1, '#6b6e75']]);
  ctx.beginPath(); ctx.moveTo(cx - 12, floor - 32); ctx.lineTo(cx + 12, floor - 32); ctx.lineTo(cx + 100, floor - 22); ctx.lineTo(cx + 100, floor - 16); ctx.lineTo(cx - 100, floor - 16); ctx.lineTo(cx - 100, floor - 22); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#2c2d31'; ctx.lineWidth = 2; ctx.stroke();
  // wheels
  [-96, -48, 0, 48, 96].forEach(dx => {
    ellipse(ctx, cx + dx, floor - 10, 10, 10);
    ctx.fillStyle = radial(ctx, cx + dx - 3, floor - 13, 1, 11, [[0, '#55555c'], [1, '#0b0b0d']]); ctx.fill();
  });
  return c;
}
