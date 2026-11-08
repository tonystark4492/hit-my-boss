import { STORAGE_KEY } from '../config.js';

const DEFAULTS = {
  settings: {
    musicVolume: 0.6,
    sfxVolume: 0.85,
    musicMuted: false,
    sfxMuted: false
  }
};

// Small wrapper around localStorage. Never throws (private mode, full storage, etc.).
class StorageService {
  constructor() {
    this.data = structuredClone(DEFAULTS);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        this.data = { ...this.data, ...saved, settings: { ...DEFAULTS.settings, ...(saved.settings || {}) } };
      }
    } catch (e) {
      console.warn('[Storage] could not load save, using defaults', e);
    }
  }
  get settings() { return this.data.settings; }
  setSetting(key, value) {
    this.data.settings[key] = value;
    this.save();
  }
  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); }
    catch (e) { console.warn('[Storage] save failed', e); }
  }
}

export const storage = new StorageService();
