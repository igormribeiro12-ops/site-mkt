// Monta o jogo Phaser dentro de um elemento React (ocupa toda a área do mundo).

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { uiStore } from '../state/store';
import { CityScene } from './scenes/CityScene';
import { OfficeScene } from './scenes/OfficeScene';

/**
 * Usa WebGL quando há aceleração de vídeo. Se o navegador só oferece WebGL
 * por software (muito lento), desenha com Canvas 2D.
 */
function pickRenderer(): number {
  const forced = new URLSearchParams(window.location.search).get('renderer');
  if (forced === 'canvas') return Phaser.CANVAS;
  if (forced === 'webgl') return Phaser.WEBGL;
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl', { failIfMajorPerformanceCaveat: true }) as WebGLRenderingContext | null;
    if (!gl) return Phaser.CANVAS;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    if (/swiftshader|llvmpipe|software|basic render/i.test(name)) return Phaser.CANVAS;
    return Phaser.WEBGL;
  } catch {
    return Phaser.CANVAS;
  }
}

export function GameCanvas({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    const first = uiStore.get().scene === 'city' ? CityScene : OfficeScene;
    const other = first === OfficeScene ? CityScene : OfficeScene;
    let game: Phaser.Game | null = null;
    // Espera as fontes carregarem para os textos do cenário saírem certos.
    const start = () => {
      if (!host.current) return;
      game = new Phaser.Game({
        type: pickRenderer(),
        parent,
        backgroundColor: '#05070f',
        scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth || 800, height: parent.clientHeight || 600 },
        render: { antialias: true, antialiasGL: false, roundPixels: false, powerPreference: 'high-performance' },
        scene: [first, other],
        banner: false,
        input: { keyboard: { target: window } },
        audio: { noAudio: true },
      });
      if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__phaser = game;
    };
    let cancelled = false;
    const fonts = document.fonts?.ready ?? Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 800))]).then(() => {
      if (!cancelled) start();
    });
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);

  return <div ref={host} className={className} data-testid="game-canvas" />;
}
