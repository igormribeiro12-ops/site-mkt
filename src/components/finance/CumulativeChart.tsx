import { useState } from 'react';
import { cn } from '../../lib/cn';
import { formatCurrency } from '../../lib/format';

// Par divergente validado (azul ↔ vermelho) contra superfície clara.
const POSITIVE = '#2a78d6';
const NEGATIVE = '#e34948';

interface Point {
  month: number;
  balance: number;
}

interface Props {
  data: Point[];
  className?: string;
}

/**
 * Saldo acumulado mês a mês (investimento inicial negativo + resultado mensal).
 * Colunas a partir de uma única linha de base no zero; vermelho = investimento
 * ainda não recuperado, azul = já recuperado.
 */
export function CumulativeChart({ data, className }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const maxPos = Math.max(0, ...data.map((d) => d.balance));
  const maxNeg = Math.max(0, ...data.map((d) => -d.balance));
  const span = maxPos + maxNeg || 1;
  const baseline = maxPos / span; // fração da altura acima do zero
  const recoveryIndex = data.findIndex((d) => d.balance >= 0);
  const firstNegative = data[0]?.balance < 0;
  const labelled = new Set([0, data.length - 1]);
  if (firstNegative && recoveryIndex > 0) labelled.add(recoveryIndex);

  return (
    <figure className={cn('min-w-0', className)}>
      <figcaption className="sr-only">
        Saldo acumulado nos próximos {data.length} meses, considerando o investimento inicial.
      </figcaption>

      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600" aria-hidden>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: NEGATIVE }} />
          Investimento ainda não recuperado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: POSITIVE }} />
          Investimento recuperado (saldo positivo)
        </span>
      </div>

      <div className="relative ml-9 h-52 select-none">
        {/* Linha de base (zero), com o rótulo na margem esquerda */}
        <div className="absolute inset-x-0 border-t border-slate-300" style={{ top: `${baseline * 100}%` }} aria-hidden>
          <span className="absolute -left-9 -top-2 w-8 text-right text-[10px] font-medium text-slate-400">R$ 0</span>
        </div>

        <div className="absolute inset-0 flex">
          {data.map((point, i) => {
            const positive = point.balance >= 0;
            const height = (Math.abs(point.balance) / span) * 100;
            const isActive = active === i;
            const label = `Mês ${point.month}: saldo acumulado de ${formatCurrency(point.balance)}`;
            return (
              <div
                key={point.month}
                className="relative flex-1 outline-none focus-visible:bg-violet-50"
                tabIndex={0}
                role="img"
                aria-label={label}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              >
                {isActive && <div className="absolute inset-0 rounded-md bg-slate-100/70" aria-hidden />}
                <div
                  className={cn(
                    'absolute left-1/2 w-[60%] max-w-6 -translate-x-1/2 transition-[height,opacity] duration-500',
                    positive ? 'rounded-t-[4px]' : 'rounded-b-[4px]',
                    active !== null && !isActive && 'opacity-60',
                  )}
                  style={{
                    background: positive ? POSITIVE : NEGATIVE,
                    height: `${Math.max(height, point.balance === 0 ? 0 : 0.8)}%`,
                    ...(positive ? { bottom: `${(1 - baseline) * 100}%` } : { top: `${baseline * 100}%` }),
                  }}
                  aria-hidden
                />
                {labelled.has(i) && !isActive && (
                  <span
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tabular-nums text-slate-600"
                    style={
                      positive
                        ? { bottom: `calc(${(1 - baseline) * 100 + height}% + 4px)` }
                        : { top: `calc(${baseline * 100 + height}% + 4px)` }
                    }
                    aria-hidden
                  >
                    {formatCurrency(point.balance, true)}
                  </span>
                )}
                {isActive && (
                  <div
                    className={cn(
                      'pointer-events-none absolute top-0 z-10 w-max max-w-44 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg',
                      i < data.length / 2 ? 'left-1/2' : 'right-1/2',
                    )}
                    aria-hidden
                  >
                    <p className="font-semibold">Mês {point.month}</p>
                    <p className="tabular-nums text-white/85">{formatCurrency(point.balance)}</p>
                    <p className="text-[10px] text-white/60">{positive ? 'Investimento recuperado' : 'Ainda não recuperado'}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ml-9 mt-2 flex text-center text-[11px] font-medium text-slate-400" aria-hidden>
        {data.map((d) => (
          <span key={d.month} className="flex-1">
            {d.month}
          </span>
        ))}
      </div>
      <p className="ml-9 mt-1 text-center text-[11px] text-slate-400" aria-hidden>
        Meses de funcionamento
      </p>

      <details className="mt-3 text-sm print:hidden">
        <summary className="cursor-pointer text-xs font-semibold text-violet-700 hover:underline">Ver os valores em tabela</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-1.5 font-semibold">Mês</th>
              <th className="py-1.5 text-right font-semibold">Saldo acumulado</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month} className="border-b border-slate-100">
                <td className="py-1.5 text-slate-600">Mês {d.month}</td>
                <td className="py-1.5 text-right tabular-nums text-slate-800">{formatCurrency(d.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
