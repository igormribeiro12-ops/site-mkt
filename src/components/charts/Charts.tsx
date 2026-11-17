import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineIcon } from 'lucide-react';
import type { MonthReport } from '../../game/types';
import { money, moneyShort, num, numShort } from '../../game/format';

// Paleta categórica validada (daltonismo e contraste) contra a superfície #0f1524.
export const SERIES = {
  blue: '#3987e5',
  orange: '#d95926',
  aqua: '#199e70',
  yellow: '#c98500',
  magenta: '#d55181',
};

const GRID = 'rgba(148, 163, 184, 0.12)';

const tooltipProps = {
  contentStyle: {
    background: '#0f1524',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#e2e8f0',
    fontSize: 12,
    boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
  },
  labelStyle: { color: '#fff', fontWeight: 700, marginBottom: 4 },
  cursor: { stroke: 'rgba(148,163,184,0.35)', strokeWidth: 1, fill: 'rgba(148,163,184,0.08)' },
};

function EmptyChart({ height }: { height: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-center text-sm text-slate-500" style={{ height }}>
      <LineIcon className="size-6" aria-hidden />
      Os gráficos aparecem depois do primeiro mês.
    </div>
  );
}

function ChartFrame({ title, children, height = 240, empty }: { title: string; children: ReactNode; height?: number; empty?: boolean }) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 text-sm font-semibold text-slate-200">{title}</figcaption>
      {empty ? <EmptyChart height={height} /> : <div style={{ height }}>{children}</div>}
    </figure>
  );
}

/** Rótulo com o nome da série no último ponto da linha. */
function endLabel(name: string, color: string, lastIndex: number) {
  return function EndLabel(props: { index?: number; x?: number | string; y?: number | string }) {
    if (props.index !== lastIndex || props.x === undefined || props.y === undefined) return null;
    return (
      <text x={Number(props.x) + 6} y={Number(props.y) + 4} fill="#cbd5e1" fontSize={11} fontWeight={600}>
        <tspan fill={color}>●</tspan> {name}
      </text>
    );
  };
}

export function FinanceChart({ history, height = 260 }: { history: MonthReport[]; height?: number }) {
  const data = history.map((h) => ({ mes: `M${h.month}`, Receita: h.revenue, Despesas: h.totalCosts, Lucro: h.profit }));
  const last = data.length - 1;
  return (
    <ChartFrame title="Evolução financeira (por mês)" height={height} empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 70, left: 4, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="mes" tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tickFormatter={(v: number) => moneyShort(v)} tickLine={false} axisLine={false} width={88} />
          <ReferenceLine y={0} stroke="rgba(148,163,184,0.4)" />
          <Tooltip {...tooltipProps} formatter={(v) => money(Number(v))} />
          <Legend verticalAlign="top" height={28} iconType="circle" iconSize={8} />
          <Line type="monotone" dataKey="Receita" stroke={SERIES.blue} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#0f1524' }} label={endLabel('Receita', SERIES.blue, last)} />
          <Line type="monotone" dataKey="Despesas" stroke={SERIES.orange} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#0f1524' }} label={endLabel('Despesas', SERIES.orange, last)} />
          <Line type="monotone" dataKey="Lucro" stroke={SERIES.aqua} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#0f1524' }} label={endLabel('Lucro', SERIES.aqua, last)} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function MarketingChart({ history, height = 240 }: { history: MonthReport[]; height?: number }) {
  const data = history.map((h) => ({
    mes: `M${h.month}`,
    'Investimento em marketing': h.costs.marketing,
    'Receita das campanhas': h.campaigns.reduce((s, c) => s + c.revenue, 0),
  }));
  return (
    <ChartFrame title="Desempenho de marketing" height={height} empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }} barGap={2}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="mes" tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tickFormatter={(v: number) => moneyShort(v)} tickLine={false} axisLine={false} width={88} />
          <Tooltip {...tooltipProps} formatter={(v) => money(Number(v))} />
          <Legend verticalAlign="top" height={28} iconType="circle" iconSize={8} />
          <Bar dataKey="Investimento em marketing" fill={SERIES.orange} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="Receita das campanhas" fill={SERIES.blue} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function CustomersChart({ history, height = 240 }: { history: MonthReport[]; height?: number }) {
  const data = history.map((h) => ({ mes: `M${h.month}`, 'Clientes novos': Math.round(h.newCustomers), 'Compras recorrentes': Math.round(h.returningOrders) }));
  return (
    <ChartFrame title="Vendas por mês: clientes novos e recorrentes" height={height} empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="mes" tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tickFormatter={(v: number) => numShort(v)} tickLine={false} axisLine={false} width={48} />
          <Tooltip {...tooltipProps} formatter={(v) => num(Number(v))} />
          <Legend verticalAlign="top" height={28} iconType="circle" iconSize={8} />
          <Bar dataKey="Compras recorrentes" stackId="a" fill={SERIES.aqua} maxBarSize={24} stroke="#0f1524" strokeWidth={2} />
          <Bar dataKey="Clientes novos" stackId="a" fill={SERIES.blue} radius={[4, 4, 0, 0]} maxBarSize={24} stroke="#0f1524" strokeWidth={2} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function AudienceChart({ history, height = 220 }: { history: MonthReport[]; height?: number }) {
  const data = history.map((h) => ({ mes: `M${h.month}`, Seguidores: Math.round(h.followers) }));
  const last = data.length - 1;
  return (
    <ChartFrame title="Seguidores nas redes" height={height} empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="mes" tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tickFormatter={(v: number) => numShort(v)} tickLine={false} axisLine={false} width={48} />
          <Tooltip {...tooltipProps} formatter={(v) => num(Number(v))} />
          <Line type="monotone" dataKey="Seguidores" stroke={SERIES.magenta} strokeWidth={2} dot={(p: { index?: number; cx?: number; cy?: number }) => (p.index === last ? <circle key="end" cx={p.cx} cy={p.cy} r={4} fill={SERIES.magenta} stroke="#0f1524" strokeWidth={2} /> : <g key={`d${p.index}`} />)} activeDot={{ r: 5, strokeWidth: 2, stroke: '#0f1524' }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function SatisfactionChart({ history, height = 220 }: { history: MonthReport[]; height?: number }) {
  const data = history.map((h) => ({ mes: `M${h.month}`, Satisfação: Math.round(h.satisfaction), Reputação: Math.round(h.reputation) }));
  const last = data.length - 1;
  return (
    <ChartFrame title="Satisfação dos clientes e reputação (0 a 100)" height={height} empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 80, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="mes" tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={36} />
          <Tooltip {...tooltipProps} />
          <Legend verticalAlign="top" height={28} iconType="circle" iconSize={8} />
          <Line type="monotone" dataKey="Satisfação" stroke={SERIES.aqua} strokeWidth={2} dot={false} label={endLabel('Satisfação', SERIES.aqua, last)} />
          <Line type="monotone" dataKey="Reputação" stroke={SERIES.yellow} strokeWidth={2} dot={false} label={endLabel('Reputação', SERIES.yellow, last)} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
