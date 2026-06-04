import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        scene2: resolve(__dirname, 'scene2.html'),
      },
    },
  },
  server: {
    open: true,
  },
});
