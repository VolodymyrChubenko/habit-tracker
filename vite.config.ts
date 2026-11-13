/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      manifest: {
        name: 'Challenge Tracker',
        short_name: 'Challenges',
        description: 'Відслідковуй щоденні челенджі',
        display: 'standalone',
        orientation: 'portrait',
        // Маніфест читається на етапі збірки — CSS-теми сюди не доходять.
        // Синхронізуй вручну з --color-bg / --color-accent у src/styles/themes/_light.scss
        background_color: '#FAF7F0',
        theme_color: '#7CB9A8',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // es-збірка SW у плагіні хардкодить deprecated inlineDynamicImports
        // (шумить WARN у rolldown-vite); iife-гілка чиста, а SW і так один файл
        rollupFormat: 'iife',
      },
    }),
  ],
  css: {
    modules: {
      generateScopedName: '[local]_[hash:5]',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts'],
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },
});
