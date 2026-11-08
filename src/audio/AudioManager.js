import { storage } from '../core/Storage.js';
import { buildSfxLibrary } from './SfxLibrary.js';
import { renderMusic } from './MusicGenerator.js';

import { CUSTOM_MUSIC_FILE } from '../config.js';

const VOICE_SOUNDS = new Set(['grunt', 'shocked', 'angry', 'laugh']);
const MAX_VOICES = 12;

class AudioManager {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.lib = {};
    this.lastPlay = {};
    this.lastVariation = {};
    this.active = new Set();
    this.voiceNode = null;
    this.musicSource = null;
    this.musicBuffer = null;
    this.paused = false;
  }

  // Must be called from a user gesture (tap/click) - browsers and Android WebView require it.
  async init() {
    if (this.ctx) { this.resumeContext(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { console.warn('[Audio] Web Audio not supported'); return; }
    this.ctx = new AC({ latencyHint: 'interactive' });
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.applySettings();
    this.resumeContext();

    try {
      this.lib = await buildSfxLibrary();
      this.ready = true;
    } catch (e) {
      console.error('[Audio] SFX render failed', e);
    }
    this.loadMusic();
  }

  resumeContext() {
    if (this.ctx && this.ctx.state !== 'running' && !this.paused) this.ctx.resume().catch(() => {});
  }

  async loadMusic() {
    if (CUSTOM_MUSIC_FILE) {
      try {
        const res = await fetch(CUSTOM_MUSIC_FILE);
        if (res.ok) {
          this.musicBuffer = await this.ctx.decodeAudioData(await res.arrayBuffer());
          console.info('[Audio] using custom music', CUSTOM_MUSIC_FILE);
        }
      } catch (e) { console.warn('[Audio] custom music failed, using procedural loop', e); }
    }
    if (!this.musicBuffer) {
      try { this.musicBuffer = await renderMusic(); }
      catch (e) { console.error('[Audio] music render failed', e); return; }
    }
    this.startMusic();
  }

  startMusic() {
    if (!this.musicBuffer || this.musicSource) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.musicBuffer;
    src.loop = true;
    // gentle fade in
    const now = this.ctx.currentTime;
    this.musicFade = this.ctx.createGain();
    this.musicFade.gain.setValueAtTime(0, now);
    this.musicFade.gain.linearRampToValueAtTime(1, now + 2);
    src.connect(this.musicFade).connect(this.musicGain);
    src.start();
    this.musicSource = src;
  }

  applySettings() {
    if (!this.ctx) return;
    const s = storage.settings;
    const t = this.ctx.currentTime;
    // squared curve feels more natural for volume sliders
    this.musicGain.gain.setTargetAtTime(s.musicMuted ? 0 : s.musicVolume * s.musicVolume * 0.7, t, 0.05);
    this.sfxGain.gain.setTargetAtTime(s.sfxMuted ? 0 : s.sfxVolume * s.sfxVolume, t, 0.03);
  }

  /**
   * Play a sound effect.
   * @param {string} name   recipe name (punch, light, heavy, bonk, thud, grunt, ...)
   * @param {object} opt    volume (0..1), pitch (rate multiplier), pitchVar (random +/-)
   */
  play(name, opt = {}) {
    if (!this.ready || this.paused || !this.ctx || this.ctx.state !== 'running') return;
    const vars = this.lib[name];
    if (!vars || !vars.length) return;
    const now = this.ctx.currentTime;
    const minGap = opt.minGap ?? 0.035;
    if (this.lastPlay[name] && now - this.lastPlay[name] < minGap) return; // avoid machine-gun overlap
    if (this.active.size >= MAX_VOICES) return;
    this.lastPlay[name] = now;

    // pick a variation that differs from the last one
    let v = Math.floor(Math.random() * vars.length);
    if (vars.length > 1 && v === this.lastVariation[name]) v = (v + 1) % vars.length;
    this.lastVariation[name] = v;

    const src = this.ctx.createBufferSource();
    src.buffer = vars[v];
    const pitchVar = opt.pitchVar ?? 0.05;
    src.playbackRate.value = (opt.pitch ?? 1) * (1 + (Math.random() * 2 - 1) * pitchVar);
    const g = this.ctx.createGain();
    g.gain.value = opt.volume ?? 1;
    src.connect(g).connect(this.sfxGain);

    // the boss only has one mouth - a new voice line cuts the previous one
    if (VOICE_SOUNDS.has(name)) {
      if (this.voiceNode) { try { this.voiceNode.stop(); } catch { /* already stopped */ } }
      this.voiceNode = src;
    }
    this.active.add(src);
    src.onended = () => { this.active.delete(src); if (this.voiceNode === src) this.voiceNode = null; };
    src.start();
  }

  pause() {
    this.paused = true;
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
  }

  resume() {
    this.paused = false;
    this.resumeContext();
  }
}

export const audio = new AudioManager();
