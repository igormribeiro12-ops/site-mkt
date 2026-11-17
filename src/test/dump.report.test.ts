// Gera partidas salvas para inspeção visual: DUMP=pasta npx vitest run src/test/dump.report.test.ts
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { advanceMonth, createGame, resolveEvent } from '../game/engine';
import { getEvent, isChoiceAvailable } from '../game/events';
import { balanced, draft, play } from './bots';

test.skipIf(!process.env.DUMP)('gera partidas', () => {
  const dir = process.env.DUMP!;
  // Partida no meio (mês 8), com relatório e evento pendentes resolvidos.
  let s = createGame({ ...draft('moda'), playerName: 'Ana', name: 'Vibe Store', slogan: 'Vista sua personalidade.', description: 'Moda autoral com estampas exclusivas.', product: 'Camisetas autorais', differential: 'Estampas criadas por artistas locais', logo: { primary: '#ec4899', secondary: '#a855f7', icon: 'shirt', shape: 'hexagon', font: 'fredoka', layout: 'horizontal' } }, 2024);
  for (let i = 0; i < 7; i++) {
    s = balanced(s);
    s = advanceMonth(s).state;
    if (s.pendingEvent) {
      const ev = getEvent(s.pendingEvent.eventId)!;
      const c = ev.choices.find((x) => isChoiceAvailable(s, x))!;
      const r = resolveEvent(s, c.id);
      if (r.ok) s = r.state;
    }
  }
  s = balanced(s);
  writeFileSync(`${dir}/mid.json`, JSON.stringify({ ...s, tutorialDone: true, unseenReport: false }));
  writeFileSync(`${dir}/tutorial.json`, JSON.stringify({ ...createGame({ ...draft('alimentacao'), playerName: 'Ana', name: 'Doce Encanto' }, 7) }));
  const won = play('beleza', balanced, 'normal', 99).state;
  writeFileSync(`${dir}/won.json`, JSON.stringify({ ...won, company: { ...won.company, name: 'Glow Lab', slogan: 'Brilhe do seu jeito.' }, player: { ...won.player, name: 'Ana' }, unseenReport: false, tutorialDone: true }));
  const lost = play('tecnologia', (x) => x, 'normal', 5).state;
  writeFileSync(`${dir}/lost.json`, JSON.stringify({ ...lost, unseenReport: false, tutorialDone: true }));
});
