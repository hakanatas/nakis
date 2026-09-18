import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // relative asset paths so the build works at any URL, e.g. https://hakanatas.github.io/nakis/
  base: './',
  build: {
    target: 'es2020',
  },
});
