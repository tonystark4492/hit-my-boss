// Original procedural "corporate comedy funk" loop.
// Rendered once with an OfflineAudioContext into a seamless 16-bar AudioBuffer,
// then looped. All notes, patterns and sounds here are original.

const SR = 44100;
const BPM = 108;
const STEP = 60 / BPM / 4;          // one 16th note
const BARS = 16;
export const MUSIC_LOOP_SECONDS = BARS * 16 * STEP;

const mtof = n => 440 * Math.pow(2, (n - 69) / 12);

// [bass root midi, chord tones (semitones above root, for the e-piano voicing)]
const CHORDS = [
  // Section A - Dm7 / G9 vamp, then Bbmaj7 -> A7
  [38, [3, 7, 10, 14]], [43, [4, 10, 14, 21]], [38, [3, 7, 10, 14]], [43, [4, 10, 14, 21]],
  [38, [3, 7, 10, 14]], [43, [4, 10, 14, 21]], [34, [4, 7, 11, 14]], [33, [4, 10, 13, 19]],
  // Section B - a little "presentation montage" turnaround
  [43, [3, 7, 10, 14]], [36, [4, 10, 14, 21]], [41, [4, 7, 11, 14]], [34, [4, 7, 11, 14]],
  [40, [3, 6, 10, 15]], [33, [4, 10, 13, 19]], [38, [3, 7, 10, 14]], [33, [4, 10, 13, 16]]
];

// Melody phrases: [step within 2 bars (0-31), midi note, length in steps]
const MEL_A1 = [[0, 74, 2], [3, 77, 1], [4, 76, 1], [6, 74, 2], [8, 72, 1], [10, 69, 3], [14, 72, 1], [15, 73, 1],
  [16, 74, 1], [18, 71, 1], [19, 74, 1], [22, 77, 2], [24, 76, 1], [26, 74, 1], [27, 71, 1], [28, 67, 3]];
const MEL_A2 = [[0, 81, 1], [1, 79, 1], [2, 77, 1], [3, 76, 1], [4, 74, 2], [8, 72, 1], [9, 74, 1], [11, 72, 1], [12, 69, 2],
  [16, 71, 1], [17, 72, 1], [18, 73, 1], [19, 74, 3], [24, 79, 1], [26, 77, 1], [27, 76, 1], [28, 74, 2], [30, 73, 1]];
const MEL_A4 = [[0, 77, 2], [2, 74, 1], [3, 70, 1], [4, 74, 2], [6, 77, 1], [8, 81, 3], [12, 79, 1], [14, 77, 1],
  [16, 76, 2], [18, 73, 1], [19, 76, 1], [20, 79, 2], [24, 77, 1], [25, 76, 1], [26, 73, 1], [28, 69, 2]];
const MEL_B = [
  [[0, 74, 6], [6, 77, 2], [8, 79, 6], [14, 77, 2], [16, 76, 4], [20, 72, 2], [22, 76, 2], [24, 79, 6], [30, 76, 2]],
  [[0, 77, 4], [4, 81, 4], [8, 79, 2], [10, 77, 2], [12, 76, 4], [16, 74, 6], [22, 77, 2], [24, 81, 4], [28, 79, 4]],
  [[0, 79, 4], [4, 76, 2], [6, 74, 2], [8, 70, 6], [14, 72, 2], [16, 73, 4], [20, 76, 2], [22, 79, 2], [24, 81, 4], [28, 79, 2], [30, 76, 2]],
  [[0, 77, 3], [3, 76, 1], [4, 74, 8], [12, 72, 2], [14, 69, 2], [16, 73, 1], [18, 76, 1], [20, 79, 1], [22, 82, 2]]
];

// Bass groove per bar: [step, semitones above root, length]. Last note walks to next root.
const BASS = [[0, 0, 2], [3, 12, 1], [4, 0, 1], [6, 7, 1], [7, 10, 1], [8, 0, 2], [10, 12, 1], [11, 0, 1], [13, 7, 1], [14, 10, 1]];

function makeNoise(ctx, sec) {
  const b = ctx.createBuffer(1, Math.floor(sec * ctx.sampleRate), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function makeImpulse(ctx, sec, decay) {
  const len = Math.floor(sec * ctx.sampleRate);
  const b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}

const BAR_SEC = 16 * STEP;
const TAIL = 1.5;           // reverb/release tail carried into the next segment
const SEGMENTS = 4;         // rendered in parallel (each OfflineAudioContext gets its own thread)

// Renders the whole loop as 4 parallel chunks, then overlap-adds them into one seamless buffer
// (the last chunk's tail wraps around to the start so the loop point is click-free).
export async function renderMusic() {
  const per = BARS / SEGMENTS;
  const chunks = await Promise.all(
    Array.from({ length: SEGMENTS }, (_, i) => renderBars(i * per, (i + 1) * per))
  );
  const total = Math.round(MUSIC_LOOP_SECONDS * SR);
  const out = new AudioBuffer({ numberOfChannels: 2, length: total, sampleRate: SR });
  for (let ch = 0; ch < 2; ch++) {
    const dst = out.getChannelData(ch);
    chunks.forEach((buf, i) => {
      const src = buf.getChannelData(ch);
      const offset = Math.round(i * per * BAR_SEC * SR);
      for (let k = 0; k < src.length; k++) dst[(offset + k) % total] += src[k];
    });
  }
  return out;
}

async function renderBars(b0, b1) {
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * ((b1 - b0) * BAR_SEC + TAIL)), SR);
  const NB = makeNoise(ctx, 1);

  // --- mix bus
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.15;
  const master = ctx.createGain(); master.gain.value = 0.8;
  comp.connect(master).connect(ctx.destination);
  const reverb = ctx.createConvolver(); reverb.buffer = makeImpulse(ctx, 1.4, 3);
  const revGain = ctx.createGain(); revGain.gain.value = 0.22;
  reverb.connect(revGain).connect(comp);
  const bus = (vol, pan, send = 0) => {
    const g = ctx.createGain(); g.gain.value = vol;
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    g.connect(p).connect(comp);
    if (send) { const s = ctx.createGain(); s.gain.value = send; g.connect(s).connect(reverb); }
    return g;
  };
  const drumBus = bus(0.9, 0), hatBus = bus(0.32, 0.3), bassBus = bus(0.55, 0);
  const keysBus = bus(0.22, -0.35, 0.6), leadBus = bus(0.2, 0.12, 0.5), percBus = bus(0.3, -0.2, 0.3);

  // --- instruments
  const kick = (t, v = 1) => {
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.11);
    const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    o.connect(g).connect(drumBus); o.start(t); o.stop(t + 0.34);
  };
  const noiseHit = (t, out, type, f, q, dur, v, offset = Math.random() * 0.8) => {
    const s = ctx.createBufferSource(); s.buffer = NB;
    const bf = ctx.createBiquadFilter(); bf.type = type; bf.frequency.value = f; bf.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(bf).connect(g).connect(out); s.start(t, offset, dur + 0.02);
  };
  const snare = (t, v = 1) => {
    noiseHit(t, drumBus, 'highpass', 1400, 0.7, 0.16, 0.55 * v);
    noiseHit(t, drumBus, 'bandpass', 3200, 0.8, 0.09, 0.35 * v);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.08);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.45 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(g).connect(drumBus); o.start(t); o.stop(t + 0.12);
  };
  const clap = t => { [0, 0.012, 0.024].forEach(d => noiseHit(t + d, drumBus, 'bandpass', 1600, 1.2, 0.08, 0.3)); };
  const hat = (t, v, open = false) => noiseHit(t, hatBus, 'highpass', 7500, 0.8, open ? 0.22 : 0.04, v);
  const woodblock = (t, f) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    o.connect(g).connect(percBus); o.start(t); o.stop(t + 0.08);
  };
  const bass = (t, note, len, v = 1) => {
    const f = mtof(note), dur = Math.max(0.08, len * STEP * 0.85);
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = f;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 7;
    lp.frequency.setValueAtTime(2400, t); lp.frequency.exponentialRampToValueAtTime(260, t + 0.13);
    const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 1800;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.55 * v, t + 0.005);
    g.gain.setValueAtTime(0.5 * v, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const sg = ctx.createGain(); sg.gain.value = 0.6;
    o.connect(lp).connect(lp2).connect(g); sub.connect(sg).connect(g); g.connect(bassBus);
    o.start(t); o.stop(t + dur + 0.02); sub.start(t); sub.stop(t + dur + 0.02);
  };
  const epiano = (t, note, dur, v = 1) => {
    const f = mtof(note);
    const car = ctx.createOscillator(); car.frequency.value = f;
    const mod = ctx.createOscillator(); mod.frequency.value = f * 1.0;
    const mg = ctx.createGain(); mg.gain.setValueAtTime(f * 1.6, t); mg.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.25);
    mod.connect(mg).connect(car.frequency);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3 * v, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    car.connect(g).connect(keysBus);
    car.start(t); car.stop(t + dur + 0.02); mod.start(t); mod.stop(t + dur + 0.02);
  };
  const pluck = (t, note, len) => {
    const f = mtof(note), dur = Math.min(0.32, len * STEP * 1.1);
    const o1 = ctx.createOscillator(); o1.type = 'square'; o1.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2.002;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 3;
    lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(700, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.32, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const g2 = ctx.createGain(); g2.gain.value = 0.35;
    o1.connect(lp); o2.connect(g2).connect(lp); lp.connect(g).connect(leadBus);
    o1.start(t); o1.stop(t + dur + 0.02); o2.start(t); o2.stop(t + dur + 0.02);
  };
  const whistle = (t, note, len) => {
    const f = mtof(note), dur = len * STEP;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(f * 0.97, t); o.frequency.linearRampToValueAtTime(f, t + 0.04);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.5;
    const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(dur, 0.25));
    lfo.connect(lg).connect(o.frequency);
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.28, t + 0.03);
    g.gain.setValueAtTime(0.26, t + Math.max(0.04, dur - 0.06)); g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.05);
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    o.connect(g); o2.connect(g2).connect(g); g.connect(leadBus);
    [o, o2, lfo].forEach(n => { n.start(t); n.stop(t + dur + 0.08); });
  };

  // --- arrangement
  for (let bar = b0; bar < b1; bar++) {
    const t0 = (bar - b0) * BAR_SEC;
    const at = s => t0 + s * STEP + (s % 2 ? STEP * 0.12 : 0);   // light swing on off-16ths
    const [root, tones] = CHORDS[bar];
    const nextRoot = CHORDS[(bar + 1) % BARS][0];
    const sectionB = bar >= 8;
    const breakBar = bar === 15;

    // drums
    const kicks = sectionB ? [0, 7, 10, 14] : [0, 7, 10];
    kicks.forEach(s => { if (!(breakBar && s >= 8)) kick(at(s), s === 0 ? 1 : 0.8); });
    [4, 12].forEach(s => { if (!(breakBar && s >= 8)) { snare(at(s)); if (sectionB) clap(at(s)); } });
    [7, 9, 15].forEach(s => { if (!breakBar && Math.random() > 0.35) snare(at(s), 0.18); });
    for (let s = 0; s < 16; s++) {
      if (breakBar && s >= 8) break;
      if (s === 14 && bar % 2 === 1) { hat(at(s), 0.5, true); continue; }
      hat(at(s), s % 4 === 2 ? 0.55 : s % 2 === 0 ? 0.35 : 0.16);
    }
    if (bar % 2 === 1 && !breakBar) { woodblock(at(13), 1250); woodblock(at(15), 940); }

    // bass
    if (!breakBar) {
      BASS.forEach(([s, iv, len]) => bass(at(s), root + iv, len, s === 0 ? 1 : 0.85));
      bass(at(15), nextRoot - 1, 1, 0.8);                // chromatic walk-up
    } else {
      bass(at(0), root, 2); bass(at(3), root + 12, 1); bass(at(6), root + 7, 1);
      bass(at(10), root + 4, 1); bass(at(12), root + 7, 1); bass(at(14), root + 10, 1); bass(at(15), 37, 1);
    }

    // e-piano comping (stabs on the off-beats)
    const voicing = tones.map(i => { let n = root + i; while (n < 58) n += 12; while (n > 76) n -= 12; return n; });
    const stabs = bar % 2 ? [2, 6, 11, 14] : [3, 6, 10, 13];
    stabs.forEach(s => { if (!(breakBar && s > 8)) voicing.forEach(n => epiano(at(s), n, 0.2, 0.7)); });

    // melody
    if (bar % 2 === 0) {
      let phrase, inst;
      if (!sectionB) {
        phrase = [MEL_A1, MEL_A2, MEL_A1, MEL_A4][bar / 2];
        inst = pluck;
      } else {
        phrase = MEL_B[(bar - 8) / 2];
        inst = whistle;
      }
      phrase.forEach(([s, n, len]) => inst(t0 + s * STEP + (s % 2 ? STEP * 0.12 : 0), n, len));
    }
  }

  return ctx.startRendering();
}
