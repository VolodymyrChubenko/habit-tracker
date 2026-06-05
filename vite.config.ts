import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      generateScopedName: '[local]',
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
