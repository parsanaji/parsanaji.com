import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    sourcemap: false,
    // three puts the bundle past Vite's 500 kB minified advisory; the real gate is the 180 KB gzip budget (Task 15 check)
    chunkSizeWarningLimit: 700,
  },
});
