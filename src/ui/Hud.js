import { ICONS } from './icons.js';
import { storage } from '../core/Storage.js';
import { audio } from '../audio/AudioManager.js';
import { bus, EV } from '../core/events.js';
import { GAME_W } from '../config.js';

// HTML overlay for buttons and menus. Lives above the Phaser canvas and is kept
// exactly the same size as the canvas, so it scales with every screen.
export class Hud {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('ui');
    this.started = false;
    this.paused = false;
    this.settingsFrom = null;
    this.build();
    this.bind();
    this.layout();
    // keep the overlay glued to the canvas whenever anything changes size
    const relayout = () => requestAnimationFrame(() => this.layout());
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', () => setTimeout(relayout, 300));
    game.scale.on('resize', relayout);
    if (window.ResizeObserver) new ResizeObserver(relayout).observe(game.canvas);
    [50, 300, 1000].forEach(ms => setTimeout(relayout, ms));
  }

  get scene() { return this.game.scene.getScene('Game'); }

  build() {
    this.root.innerHTML = `
      <div class="hud top-left">
        <button class="icon-btn" id="btn-pause" aria-label="Pause">${ICONS.pause}</button>
        <button class="icon-btn" id="btn-settings" aria-label="Settings">${ICONS.gear}</button>
        <div class="logo small"><span class="l1">HIT MY</span><span class="l2">BOSS</span></div>
      </div>
      <div class="hud top-right">
        <button class="icon-btn" id="btn-reset" aria-label="Reset boss">${ICONS.reset}</button>
      </div>
      <button class="punch-btn" id="btn-punch" aria-label="Punch">${ICONS.fist}<span>PUNCH</span></button>
      <div class="hint gone" id="hint">Drag the boss to grab &amp; throw &nbsp;•&nbsp; Tap or swipe to slap &nbsp;•&nbsp; Hit PUNCH!</div>

      <div class="overlay" id="ov-start">
        <div class="start-box">
          <div class="logo big"><span class="l1">HIT MY</span><span class="l2">BOSS</span></div>
          <p class="tagline">Office stress relief. No HR involved.</p>
          <button class="big-btn" id="btn-start">${ICONS.play}<span>TAP TO START</span></button>
        </div>
      </div>

      <div class="overlay hidden" id="ov-pause">
        <div class="panel">
          <h2>PAUSED</h2>
          <button class="menu-btn primary" id="btn-resume">${ICONS.play}<span>Resume</span></button>
          <button class="menu-btn" id="btn-pause-settings">${ICONS.gear}<span>Settings</span></button>
          <button class="menu-btn" id="btn-pause-reset">${ICONS.reset}<span>Reset Boss</span></button>
        </div>
      </div>

      <div class="overlay hidden" id="ov-settings">
        <div class="panel wide">
          <button class="close-btn" id="btn-settings-close" aria-label="Close">${ICONS.close}</button>
          <h2>SETTINGS</h2>
          <div class="row">
            <span class="row-icon">${ICONS.music}</span><label for="sl-music">Music</label>
            <input type="range" id="sl-music" min="0" max="100" step="1" />
            <span class="val" id="val-music"></span>
            <button class="toggle" id="tg-music" aria-label="Mute music"></button>
          </div>
          <div class="row">
            <span class="row-icon">${ICONS.speaker}</span><label for="sl-sfx">Sound FX</label>
            <input type="range" id="sl-sfx" min="0" max="100" step="1" />
            <span class="val" id="val-sfx"></span>
            <button class="toggle" id="tg-sfx" aria-label="Mute sound effects"></button>
          </div>
          <p class="note">Settings are saved on this device.</p>
        </div>
      </div>`;
    this.$ = id => this.root.querySelector('#' + id);
  }

  bind() {
    const $ = this.$;
    const tap = (el, fn) => el.addEventListener('click', e => { e.preventDefault(); audio.play('click', { pitchVar: 0 }); fn(); });

    $('btn-start').addEventListener('click', () => this.start());
    tap($('btn-pause'), () => this.pause());
    tap($('btn-resume'), () => this.resume());
    tap($('btn-settings'), () => this.openSettings());
    tap($('btn-pause-settings'), () => this.openSettings());
    tap($('btn-settings-close'), () => this.closeSettings());
    tap($('btn-reset'), () => bus.emit(EV.RESET));
    tap($('btn-pause-reset'), () => { this.resume(); bus.emit(EV.RESET); });

    // punch fires on press (not release) so it feels instant
    const punch = $('btn-punch');
    punch.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (!this.started || this.paused) return;
      bus.emit(EV.PUNCH_REQUEST);
      punch.classList.remove('pop'); void punch.offsetWidth; punch.classList.add('pop');
      this.hideHint();
    });

    // settings controls
    const s = storage.settings;
    const sync = () => {
      $('sl-music').value = Math.round(s.musicVolume * 100);
      $('sl-sfx').value = Math.round(s.sfxVolume * 100);
      $('val-music').textContent = Math.round(s.musicVolume * 100);
      $('val-sfx').textContent = Math.round(s.sfxVolume * 100);
      $('tg-music').classList.toggle('off', s.musicMuted);
      $('tg-sfx').classList.toggle('off', s.sfxMuted);
      $('tg-music').textContent = s.musicMuted ? 'OFF' : 'ON';
      $('tg-sfx').textContent = s.sfxMuted ? 'OFF' : 'ON';
      ['sl-music', 'sl-sfx'].forEach(id => $(id).style.setProperty('--fill', $(id).value + '%'));
      audio.applySettings();
    };
    $('sl-music').addEventListener('input', e => { storage.setSetting('musicVolume', e.target.value / 100); sync(); });
    $('sl-sfx').addEventListener('input', e => { storage.setSetting('sfxVolume', e.target.value / 100); sync(); });
    $('sl-sfx').addEventListener('change', () => audio.play('punch', { volume: 0.7 }));
    tap($('tg-music'), () => { storage.setSetting('musicMuted', !s.musicMuted); sync(); });
    tap($('tg-sfx'), () => { storage.setSetting('sfxMuted', !s.sfxMuted); sync(); });
    sync();

    // auto-pause when the app goes to the background (Android home button, tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (this.started && !this.paused) this.pause(); audio.pause(); }
      else if (!this.paused && this.started) audio.resume();
    });

    document.getElementById('game').addEventListener('pointerdown', () => { if (this.started) this.hideHint(); });
  }

  layout() {
    const canvas = this.game.canvas;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const st = this.root.style;
    st.left = r.left + 'px'; st.top = r.top + 'px';
    st.width = r.width + 'px'; st.height = r.height + 'px';
    st.fontSize = (r.width / GAME_W * 16) + 'px';   // 1em = 16 game pixels
  }

  async start() {
    if (this.started) return;
    this.started = true;
    this.$('ov-start').classList.add('hidden');
    this.$('hint').classList.remove('gone');
    this.hintTimer = setTimeout(() => this.hideHint(), 10000);
    await audio.init();
    audio.play('click', { pitchVar: 0 });
  }

  pause() {
    if (!this.started || this.paused) return;
    this.paused = true;
    this.scene.inputCtl.cancel();
    this.game.scene.pause('Game');
    audio.pause();
    this.$('ov-pause').classList.remove('hidden');
  }

  resume() {
    this.paused = false;
    this.$('ov-pause').classList.add('hidden');
    this.$('ov-settings').classList.add('hidden');
    this.game.scene.resume('Game');
    audio.resume();
  }

  openSettings() {
    this.settingsFrom = this.paused ? 'pause' : 'game';
    if (!this.paused) {
      this.paused = true;
      this.scene.inputCtl.cancel();
      this.game.scene.pause('Game');
    }
    // keep audio running in settings so volume changes can be heard
    audio.resume();
    this.$('ov-pause').classList.add('hidden');
    this.$('ov-settings').classList.remove('hidden');
  }

  closeSettings() {
    this.$('ov-settings').classList.add('hidden');
    if (this.settingsFrom === 'pause') { this.$('ov-pause').classList.remove('hidden'); audio.pause(); }
    else this.resume();
  }

  hideHint() {
    clearTimeout(this.hintTimer);
    this.$('hint').classList.add('gone');
  }
}
