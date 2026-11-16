import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base: './' permite publicar a pasta dist em qualquer subcaminho
// (ex.: GitHub Pages) ou abri-la a partir de um servidor local simples.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    // App de página única (~150 kB gzip): o aviso padrão de 500 kB não se aplica aqui.
    chunkSizeWarningLimit: 700,
  },
});
