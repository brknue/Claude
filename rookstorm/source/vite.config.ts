import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: './',
  // build time, shown in Settings so players can see which version they have
  define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')) },
  build: { outDir: 'dist', assetsDir: 'assets', chunkSizeWarningLimit: 1500 },
  worker: { format: 'iife' },
  plugins: [VitePWA({
    registerType: 'autoUpdate',
    injectRegister: false, // registered in src/main.ts, which also switches to new versions
    includeAssets: ['icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
    manifest: {
      name: 'Rookstorm Chess', short_name: 'Rookstorm',
      description: 'Play chess vs Stockfish at any Elo, analyze games, learn openings and solve puzzles. Works offline.',
      theme_color: '#14161b', background_color: '#14161b', display: 'standalone', start_url: './', scope: './',
      icons: [
        { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,wasm,json,txt,png}'],
      globIgnores: ['**/engine/sf-asm.js'],
      runtimeCaching: [{ urlPattern: /engine\/sf-asm\.js$/, handler: 'CacheFirst', options: { cacheName: 'rs-engine-fallback' } }],
      maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
      navigateFallback: 'index.html',
      navigateFallbackDenylist: [/\.apk$/],
      importScripts: ['sw-notify.js'],
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      clientsClaim: true
    }
  })]
});
