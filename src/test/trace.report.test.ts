import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { balanced, novice, play } from './bots';
import type { SegmentId } from '../game/types';

test.skipIf(!process.env.TRACE)('trace', () => {
  const out: string[] = [];
  for (const seg of (process.env.SEGS ?? 'tecnologia,alimentacao').split(',') as SegmentId[]) {
    const r = play(seg, process.env.BOT === 'novice' ? novice : balanced, 'normal', Number(process.env.SEED ?? 777));
    out.push(`== ${seg} ${r.phase} ${r.state.endReason ?? ''}`);
    out.push('m\trev\tprofit\tcash\tnew\tcamp\torg\tlead\tret\tcap\tunmet\tmkt\tsal\tvar\trent\tsat\trep\toffer\tlvl\tinfra\temp');
    for (const h of r.state.history) {
      out.push([h.month, h.revenue, h.profit, h.cashEnd, h.newCustomers, h.newFromCampaigns, h.newFromOrganic, h.newFromLeads, h.returningOrders, h.capacity, h.unmetOrders, h.costs.marketing, h.costs.salaries, h.costs.variable, h.costs.rent, h.satisfaction, h.reputation, h.offerScore.toFixed(2)].map((v) => typeof v === 'number' ? Math.round(v) : v).join('\t'));
    }
    out.push('decisions: ' + r.state.decisions.map((d) => `${d.month}:${d.text}`).join(' | '));
  }
  writeFileSync(process.env.TRACE!, out.join('\n'));
});
