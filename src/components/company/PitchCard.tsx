import type { ReactNode } from 'react';
import { Quote } from 'lucide-react';
import type { CompanyInfo } from '../../types';
import { segmentLabel } from '../../lib/constants';
import { clause } from '../../lib/text';

function Slot({ value, placeholder }: { value: string; placeholder: string }) {
  const text = clause(value);
  if (!text) return <span className="rounded bg-slate-100 px-1 italic text-slate-400">{placeholder}</span>;
  return <strong className="font-semibold text-slate-900">{text}</strong>;
}

export function PitchText({ company }: { company: CompanyInfo }): ReactNode {
  const segment = segmentLabel(company.segment, company.segmentOther);
  return (
    <>
      A <Slot value={company.name} placeholder="nome da empresa" /> é uma empresa de{' '}
      <Slot value={segment.toLowerCase()} placeholder="segmento" /> criada por{' '}
      <Slot value={company.founder} placeholder="fundador(a)" />. Nós resolvemos este problema:{' '}
      <Slot value={company.problem} placeholder="problema" />. Para isso, oferecemos{' '}
      <Slot value={company.offering} placeholder="produto ou serviço" />. Nosso diferencial:{' '}
      <Slot value={company.differential} placeholder="diferencial" />.
    </>
  );
}

/** "Pitch" montado automaticamente com as respostas da Etapa 1. */
export function PitchCard({ company }: { company: CompanyInfo }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-[1px] shadow-xl shadow-indigo-600/15">
      <div className="rounded-[calc(1.5rem-1px)] bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-600">
          <Quote className="size-4" aria-hidden />
          Pitch da sua empresa
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
          <PitchText company={company} />
        </p>
        <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
          O <strong>pitch</strong> é uma apresentação rápida do negócio — algo que você consegue contar em 30 segundos.
          Ele é montado com as suas respostas e aparece no painel e na apresentação final.
        </p>
      </div>
    </div>
  );
}
