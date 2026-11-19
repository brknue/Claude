import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: './',
  build: { outDir: 'dist', assetsDir: 'assets', chunkSizeWarningLimit: 1500 },
  plugins: [VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    includeAssets: ['icon.svg', 'engine/*', 'data/**/*'],
    manifest: {
      name: 'Rookstorm Chess', short_name: 'Rookstorm',
      description: 'Play chess vs Stockfish at any Elo, analyze games, learn openings and solve puzzles. Works offline.',
      theme_color: '#14161b', background_color: '#14161b', display: 'standalone', start_url: './', scope: './',
      icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,wasm,json,txt}'],
      maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
      navigateFallback: 'index.html',
      cleanupOutdatedCaches: true
    }
  })]
});
