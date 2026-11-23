// Relatório de equilíbrio (usado no ajuste): BALANCE=1 npx vitest run src/test/balance.report.test.ts
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { SEGMENTS } from '../game/data';
import { balanced, novice, passive, play, reckless } from './bots';

test.skipIf(!process.env.BALANCE)('relatório de equilíbrio', () => {
  const rows: Record<string, string | number>[] = [];
  for (const seg of SEGMENTS) {
    for (const [name, strat] of [
      ['passivo', passive],
      ['imprudente', reckless],
      ['iniciante', novice],
      ['equilibrado', balanced],
    ] as const) {
      for (const diff of ['normal', 'dificil', 'facil', 'lendario'] as const) {
        if (name !== 'equilibrado' && diff !== 'normal') continue;
        const r = play(seg.id, strat, diff, 777);
        rows.push({ seg: seg.id, bot: name, diff, fase: r.phase, mes: r.month, receita: r.revenue, caixa: r.cash, nivel: r.level, clientes: r.customers });
      }
    }
  }
  const cols = Object.keys(rows[0]);
  const text = [cols.join('\t'), ...rows.map((r) => cols.map((c) => r[c]).join('\t'))].join('\n');
  writeFileSync(process.env.BALANCE!, text);
});
