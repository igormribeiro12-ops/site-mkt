import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpenText,
  CalendarClock,
  Dices,
  Flag,
  Megaphone,
  ShoppingCart,
  Skull,
  Target,
  Trophy,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CONCEPTS, LEVELS, MONTH_LIMIT, STARTING_CAPITAL, VICTORY_REVENUE } from '../game/data';
import { money } from '../game/format';

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
      <h3 className="flex items-center gap-2 font-display text-base font-bold text-white">
        <Icon className="size-[18px] text-violet-300" aria-hidden />
        {title}
      </h3>
      <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

export function HowToPlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Como jogar"
      footer={
        <Button onClick={onClose} data-autofocus>
          Entendi, vamos jogar!
        </Button>
      }
    >
      <div className="space-y-3">
        <Section icon={Target} title="Objetivo">
          <p>
            Você começa com <strong className="text-white">{money(STARTING_CAPITAL)}</strong> e uma ideia. Crie sua empresa,
            conquiste clientes, invista em marketing e cresça até virar um império.
          </p>
        </Section>
        <Section icon={CalendarClock} title="Rodadas: cada rodada é um mês">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Veja as informações do mercado e as suas finanças.</li>
            <li>Decida onde investir: campanhas, preço, produto, equipe e estrutura.</li>
            <li>
              Clique em <strong className="text-white">Avançar mês</strong>. O jogo calcula vendas, despesas, clientes e
              reputação e mostra um relatório com o que você aprendeu.
            </li>
          </ol>
          <p>Você controla o ritmo: só avança quando quiser. O jogo salva sozinho a cada ação.</p>
        </Section>
        <Section icon={Megaphone} title="Marketing">
          <p>
            Crie campanhas em Instagram, TikTok, Google Ads, Facebook, WhatsApp, influenciadores e SEO. Cada canal tem custo,
            alcance, público e conversão diferentes, e funciona melhor em alguns mercados.
          </p>
          <p>
            Escolha o objetivo: <strong className="text-white">reconhecimento</strong>, <strong className="text-white">seguidores</strong>,{' '}
            <strong className="text-white">leads</strong> ou <strong className="text-white">vendas</strong>. As campanhas rodam todo mês até você pausar.
          </p>
        </Section>
        <Section icon={ShoppingCart} title="Vendas e operação">
          <p>
            As vendas dependem de preço, qualidade, reputação, concorrência, marketing e atendimento. Cuidado com a{' '}
            <strong className="text-white">capacidade</strong>: pedidos que você não consegue atender viram clientes insatisfeitos.
          </p>
        </Section>
        <Section icon={Dices} title="Eventos">
          <p>
            Concorrentes, posts virais, crises, investidores... A cada mês algo pode acontecer. Suas escolhas têm consequências, e o
            jogo explica cada uma.
          </p>
        </Section>
        <Section icon={Trophy} title="Níveis e conquistas">
          <p>{LEVELS.map((l) => `${l.level}. ${l.title}`).join(' · ')}</p>
          <p>Cada nível libera novos canais, cargos e expansões.</p>
        </Section>
        <Section icon={Flag} title="Como vencer">
          <p>
            Ao mesmo tempo: <strong className="text-white">{money(VICTORY_REVENUE)} de receita acumulada</strong>, nível{' '}
            <strong className="text-white">Líder de mercado</strong> e <strong className="text-white">3 meses seguidos de lucro</strong>. Você
            tem até {MONTH_LIMIT} meses.
          </p>
        </Section>
        <Section icon={Skull} title="Como perder">
          <p>
            Se o caixa passar do limite do cheque especial ou as dívidas passarem do limite, a empresa vai à falência.
          </p>
        </Section>
        <Section icon={BookOpenText} title="Glossário">
          <dl className="grid gap-2 sm:grid-cols-2">
            {Object.values(CONCEPTS).map((c) => (
              <div key={c.term} className="rounded-xl bg-white/[0.03] p-2.5">
                <dt className="text-[13px] font-semibold text-white">{c.term}</dt>
                <dd className="text-xs text-slate-400">{c.definition}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </Modal>
  );
}
