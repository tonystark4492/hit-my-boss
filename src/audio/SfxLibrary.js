// Original sound effects, synthesised with the Web Audio API and pre-rendered once
// into AudioBuffers (OfflineAudioContext). Playing a buffer is very cheap on phones.

const SR = 44100;

function noiseBuffer(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function noise(ctx, t, dur) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, dur + 0.05);
  src.start(t); src.stop(t + dur + 0.05);
  return src;
}

function env(ctx, t, attack, peak, decay, curve = 'exp') {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  if (curve === 'exp') g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  else g.gain.linearRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}

function softClip(ctx, amount = 2) {
  const ws = ctx.createWaveShaper();
  const n = 1024, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; curve[i] = Math.tanh(x * amount) / Math.tanh(amount); }
  ws.curve = curve;
  return ws;
}

function filter(ctx, type, freq, q = 0.7) {
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f;
}

// --- building blocks
function thump(ctx, out, t, f0, f1, dur, vol) {
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
  const g = env(ctx, t, 0.002, vol, dur);
  o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.02);
}

function burst(ctx, out, t, type, freq, q, dur, vol, sweepTo) {
  const n = noise(ctx, t, dur);
  const f = filter(ctx, type, freq, q);
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  const g = env(ctx, t, 0.001, vol, dur);
  n.connect(f).connect(g).connect(out);
}

// Formant "voice" - gives cartoon grunts, gasps and growls without recordings.
const VOWELS = {
  uh: [640, 1190, 2390], oh: [450, 800, 2830], oo: [320, 870, 2240], ah: [800, 1150, 2900],
  eh: [530, 1840, 2480], er: [490, 1350, 1690], hm: [250, 1000, 2500]
};
function voice(ctx, out, t, { pitch = 120, pitchEnd = 100, dur = 0.3, vowel = 'uh', vowel2, vol = 0.5, vib = 5, vibDepth = 4, rough = 0, breath = 0.15 }) {
  const src = ctx.createOscillator(); src.type = 'sawtooth';
  src.frequency.setValueAtTime(pitch, t);
  src.frequency.linearRampToValueAtTime(pitchEnd, t + dur);
  const lfo = ctx.createOscillator(); lfo.frequency.value = vib;
  const lfoG = ctx.createGain(); lfoG.gain.value = vibDepth;
  lfo.connect(lfoG).connect(src.frequency);
  let head = src;
  if (rough > 0) {
    const trem = ctx.createGain(); trem.gain.value = 0.6;
    const r = ctx.createOscillator(); r.frequency.value = 28 + rough * 10; r.type = 'square';
    const rg = ctx.createGain(); rg.gain.value = 0.4 * rough;
    r.connect(rg).connect(trem.gain); r.start(t); r.stop(t + dur + 0.05);
    src.connect(trem); head = trem;
    const sc = softClip(ctx, 3 + rough * 3); trem.connect(sc); head = sc;
  }
  const mix = ctx.createGain(); mix.gain.value = 1;
  const f = VOWELS[vowel], f2 = VOWELS[vowel2 || vowel];
  [1, 0.6, 0.3].forEach((amp, i) => {
    const bp = filter(ctx, 'bandpass', f[i], 9 - i * 2);
    bp.frequency.setValueAtTime(f[i], t);
    bp.frequency.linearRampToValueAtTime(f2[i], t + dur * 0.8);
    const g = ctx.createGain(); g.gain.value = amp * 3.2;
    head.connect(bp).connect(g).connect(mix);
  });
  if (breath > 0) burst(ctx, mix, t, 'bandpass', 1800, 1, dur * 0.6, breath);
  const e = ctx.createGain();
  e.gain.setValueAtTime(0.0001, t);
  e.gain.linearRampToValueAtTime(vol, t + 0.025);
  e.gain.setValueAtTime(vol, t + dur * 0.55);
  e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  mix.connect(e).connect(out);
  src.start(t); src.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
}

// --- sound recipes. Each returns [duration, build(ctx, out, variationIndex)].
const RECIPES = {
  punch: [0.45, (c, o, v) => {
    const p = [[170, 0.95, 1700], [150, 1, 1300], [190, 0.9, 2100], [160, 1, 1500]][v];
    const sc = softClip(c, 1.6); sc.connect(o);
    thump(c, sc, 0, p[0], 42, 0.22, p[1]);
    burst(c, sc, 0, 'lowpass', p[2], 1, 0.09, 0.7, 300);
    burst(c, sc, 0, 'highpass', 3500, 0.7, 0.018, 0.5);
    burst(c, sc, 0.004, 'bandpass', 900, 2, 0.05, 0.35);
  }, 4],
  light: [0.3, (c, o, v) => {
    const f = [2600, 3100, 2200][v];
    burst(c, o, 0, 'bandpass', f, 1.2, 0.07, 0.9, f * 0.6);
    burst(c, o, 0, 'highpass', 5000, 0.7, 0.012, 0.6);
    thump(c, o, 0, 240, 120, 0.1, 0.35);
  }, 3],
  heavy: [0.9, (c, o, v) => {
    const p = [[120, 1300], [105, 1000], [135, 1600]][v];
    const sc = softClip(c, 2.4); sc.connect(o);
    thump(c, sc, 0, p[0], 30, 0.5, 1);
    thump(c, sc, 0, 260, 60, 0.12, 0.6);
    burst(c, sc, 0, 'lowpass', p[1], 1, 0.16, 0.9, 200);
    burst(c, sc, 0, 'bandpass', 700, 3, 0.12, 0.5);
    burst(c, sc, 0, 'highpass', 4000, 0.7, 0.025, 0.6);
    burst(c, o, 0.02, 'lowpass', 400, 0.7, 0.6, 0.25, 80);
  }, 3],
  bonk: [0.45, (c, o, v) => {
    const f = [620, 700, 540][v];
    const osc = c.createOscillator(); osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, 0); osc.frequency.exponentialRampToValueAtTime(f * 0.55, 0.25);
    const g = env(c, 0, 0.002, 0.7, 0.3); osc.connect(g).connect(o); osc.start(0); osc.stop(0.4);
    burst(c, o, 0, 'bandpass', 1400, 4, 0.04, 0.6);
    thump(c, o, 0, 180, 60, 0.15, 0.5);
  }, 3],
  whoosh: [0.25, (c, o, v) => {
    burst(c, o, 0, 'bandpass', [600, 800, 500][v], 1.5, 0.18, 0.35, [2600, 3200, 2200][v]);
  }, 3],
  thud: [0.4, (c, o, v) => {
    thump(c, o, 0, [110, 95, 125][v], 38, 0.28, 0.9);
    burst(c, o, 0, 'lowpass', 500, 0.8, 0.12, 0.5, 120);
  }, 3],
  grunt: [0.45, (c, o, v) => {
    const p = [
      { pitch: 135, pitchEnd: 95, dur: 0.22, vowel: 'oo', vowel2: 'uh' },      // "oof"
      { pitch: 120, pitchEnd: 85, dur: 0.28, vowel: 'uh', vowel2: 'er' },      // "ugh"
      { pitch: 150, pitchEnd: 110, dur: 0.18, vowel: 'oh' },                    // "oh"
      { pitch: 110, pitchEnd: 92, dur: 0.3, vowel: 'hm', vowel2: 'uh', breath: 0.3 } // "hmmph"
    ][v];
    voice(c, o, 0, { vol: 0.55, ...p });
  }, 4],
  shocked: [0.7, (c, o, v) => {
    const p = [
      { pitch: 150, pitchEnd: 340, dur: 0.45, vowel: 'oo', vowel2: 'ah' },     // "whoa!"
      { pitch: 180, pitchEnd: 380, dur: 0.35, vowel: 'uh', vowel2: 'ah' },     // "huh?!"
      { pitch: 200, pitchEnd: 300, dur: 0.5, vowel: 'eh', vowel2: 'ah', vib: 9, vibDepth: 12 } // "eeah"
    ][v];
    voice(c, o, 0, { vol: 0.5, ...p });
  }, 3],
  angry: [0.9, (c, o, v) => {
    const p = [
      { pitch: 95, pitchEnd: 80, dur: 0.55, vowel: 'er', vowel2: 'ah', rough: 1 },
      { pitch: 110, pitchEnd: 75, dur: 0.6, vowel: 'ah', vowel2: 'er', rough: 0.8 },
      { pitch: 100, pitchEnd: 120, dur: 0.5, vowel: 'uh', vowel2: 'ah', rough: 1 }
    ][v];
    voice(c, o, 0, { vol: 0.5, vib: 6, vibDepth: 6, ...p });
    if (v === 0) voice(c, o, 0.58, { pitch: 120, pitchEnd: 90, dur: 0.22, vowel: 'ah', vol: 0.4, rough: 0.6 });
  }, 3],
  laugh: [0.9, (c, o) => {
    for (let i = 0; i < 4; i++) voice(c, o, i * 0.16, { pitch: 170 - i * 8, pitchEnd: 150 - i * 8, dur: 0.12, vowel: 'ah', vol: 0.4, breath: 0.25 });
  }, 1],
  fall: [1.1, (c, o, v) => {
    const osc = c.createOscillator(); osc.type = 'sine';
    const f0 = [1500, 1300][v];
    osc.frequency.setValueAtTime(f0, 0); osc.frequency.exponentialRampToValueAtTime(260, 0.95);
    const lfo = c.createOscillator(); lfo.frequency.value = 7; const lg = c.createGain(); lg.gain.value = 18;
    lfo.connect(lg).connect(osc.frequency);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, 0); g.gain.linearRampToValueAtTime(0.28, 0.05); g.gain.setValueAtTime(0.28, 0.8); g.gain.exponentialRampToValueAtTime(0.0001, 1.0);
    osc.connect(g).connect(o); osc.start(0); osc.stop(1.05); lfo.start(0); lfo.stop(1.05);
  }, 2],
  click: [0.08, (c, o) => {
    const osc = c.createOscillator(); osc.type = 'square'; osc.frequency.value = 1300;
    const g = env(c, 0, 0.001, 0.18, 0.04); osc.connect(filter(c, 'lowpass', 3000)).connect(g).connect(o); osc.start(0); osc.stop(0.06);
    burst(c, o, 0, 'highpass', 6000, 0.7, 0.008, 0.3);
  }, 1],
  reset: [0.9, (c, o) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const osc = c.createOscillator(); osc.type = 'triangle'; osc.frequency.value = f;
      const t = i * 0.07, g = env(c, t, 0.005, 0.28, 0.4);
      osc.connect(g).connect(o); osc.start(t); osc.stop(t + 0.5);
    });
    burst(c, o, 0, 'bandpass', 400, 1.5, 0.5, 0.25, 5000);
  }, 1],
  pop: [0.15, (c, o) => {
    const osc = c.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(400, 0); osc.frequency.exponentialRampToValueAtTime(1200, 0.06);
    const g = env(c, 0, 0.002, 0.3, 0.08); osc.connect(g).connect(o); osc.start(0); osc.stop(0.12);
  }, 1]
};

async function renderOne(dur, build, v) {
  const ctx = new OfflineAudioContext(1, Math.ceil(SR * dur), SR);
  const out = ctx.createGain(); out.gain.value = 0.9; out.connect(ctx.destination);
  build(ctx, out, v);
  return ctx.startRendering();
}

// Returns { name: [AudioBuffer, ...variations] }
export async function buildSfxLibrary() {
  const lib = {};
  const jobs = [];
  for (const [name, [dur, build, count = 1]] of Object.entries(RECIPES)) {
    lib[name] = [];
    for (let v = 0; v < count; v++) {
      jobs.push(renderOne(dur, build, v).then(buf => { lib[name][v] = buf; }));
    }
  }
  await Promise.all(jobs);
  return lib;
}
