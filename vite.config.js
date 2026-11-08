import { defineConfig } from 'vite';

// base './' makes all asset paths relative, which Capacitor (Android) needs.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000
  }
});
