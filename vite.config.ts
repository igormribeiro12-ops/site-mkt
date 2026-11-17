import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base: './' permite publicar a pasta dist em qualquer subcaminho
// (ex.: GitHub Pages) ou abri-la a partir de um servidor local simples.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    // O motor 2D (Phaser, ~1,2 MB) fica em um pedaço separado, carregado só
    // quando a partida começa; o menu inicial carrega bem menos.
    chunkSizeWarningLimit: 1500,
  },
});
