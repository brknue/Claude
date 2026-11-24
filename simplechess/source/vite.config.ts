import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';
const BUILD = new Date().toISOString().slice(0, 16).replace('T', ' ');
const ANDROID = Number(/ANDROID_APP_VERSION = (\d+)/.exec(readFileSync('src/config.ts', 'utf8'))![1]);
export default defineConfig({
  base: './',
  // build time, shown in Settings so players can see which version they have
  define: { __BUILD__: JSON.stringify(BUILD) },
  build: { outDir: 'dist', assetsDir: 'assets', chunkSizeWarningLimit: 1500 },
  worker: { format: 'iife' },
  plugins: [{
    // version.json: what "Check for updates" compares with (never cached by the service worker)
    name: 'rs-version', apply: 'build',
    generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD, android: ANDROID }) }); },
  }, VitePWA({
    registerType: 'autoUpdate',
    injectRegister: false, // registered in src/main.ts, which also switches to new versions
    includeAssets: ['icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
    manifest: {
      name: 'Simple Chess', short_name: 'Simple Chess',
      description: 'A simple chess website: play Stockfish at any Elo, friends and online, analysis, openings and puzzles. Works offline.',
      theme_color: '#ffffff', background_color: '#ffffff', display: 'standalone', start_url: './', scope: './',
      icons: [
        { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,wasm,json,txt,png}'],
      globIgnores: ['**/engine/sf-asm.js', '**/version.json'],
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
