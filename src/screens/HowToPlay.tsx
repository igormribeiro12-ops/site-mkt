import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpenText,
  CalendarClock,
  Dices,
  Flag,
  Gamepad2,
  Landmark,
  MapPinned,
  Megaphone,
  ShoppingCart,
  Skull,
  Store,
  Target,
  Trophy,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  BRANCH_RAMP_MONTHS,
  BRANCH_UNLOCK,
  CONCEPTS,
  INSURANCE_COVERAGE,
  LEVELS,
  MONTH_LIMIT,
  NATIONAL_UNLOCK,
  STARTING_CAPITAL,
  VICTORY_LEVEL,
  VICTORY_REVENUE,
  VICTORY_STATES,
  VICTORY_STREAK,
} from '../game/data';
import { CITIES, STATES } from '../game/geo';
import { DAYS_PER_MONTH } from '../game/simulation';
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
            conquiste clientes, invista em marketing e cresça até ter filiais em vários estados do Brasil.
          </p>
        </Section>
        <Section icon={Gamepad2} title="Controles">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Ande com as <strong className="text-white">setas</strong> ou <strong className="text-white">W A S D</strong> — ou clique/toque no chão.
            </li>
            <li>
              Chegue perto de um objeto e aperte <strong className="text-white">E</strong> (ou Espaço), ou clique nele: computador, mesa, balcão, porta,
              móveis, funcionários.
            </li>
            <li>
              Atalhos: <strong className="text-white">1</strong> Construir · <strong className="text-white">2</strong> Contratar ·{' '}
              <strong className="text-white">3</strong> Comprar · <strong className="text-white">4</strong> Marketing · <strong className="text-white">5</strong>{' '}
              Empresa · <strong className="text-white">6</strong> Missões · <strong className="text-white">7</strong> Brasil · <strong className="text-white">P</strong> pausa ·{' '}
              <strong className="text-white">Esc</strong> menu.
            </li>
          </ul>
        </Section>
        <Section icon={CalendarClock} title="O tempo passa: dias e meses">
          <p>
            A loja abre às <strong className="text-white">8h</strong> e fecha às <strong className="text-white">18h</strong>. Durante o expediente, os
            clientes entram, olham os produtos e pagam no balcão. À noite o tempo passa rápido.
          </p>
          <p>
            Cada mês tem {DAYS_PER_MONTH} dias. No fim do mês você recebe um relatório com receita, despesas, lucro e o que aprendeu. Use pausa e
            velocidade (1x, 2x, 4x) no topo da tela. Abrir qualquer janela pausa o jogo, e ele salva sozinho.
          </p>
        </Section>
        <Section icon={Store} title="Seu escritório">
          <p>
            Compre móveis em <strong className="text-white">Construir</strong> e posicione no piso: cada item aumenta capacidade, satisfação ou
            vendas. Trabalhe você mesmo na mesa (qualidade), no balcão (atendimento) ou na produção. Funcionários contratados aparecem e trabalham nos
            postos livres. Amplie o espaço quando ficar cheio.
          </p>
        </Section>
        <Section icon={Megaphone} title="Marketing">
          <p>
            No computador (ou em Marketing), crie campanhas em Instagram, TikTok, Google Ads, Facebook, WhatsApp, influenciadores e SEO. Cada
            canal tem custo, alcance, público e conversão diferentes. Ações rápidas do dia (post, vídeo, panfletos, feira) acontecem no cenário.
            Campanhas que dão certo trazem clientes que você vê entrando na loja.
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
        <Section icon={MapPinned} title="Expansão pelo Brasil">
          <p>
            Primeiro conquiste o seu bairro e depois a cidade toda. A partir do nível {BRANCH_UNLOCK}, abra filiais em outras cidades do seu estado e da sua
            região; no nível {NATIONAL_UNLOCK}, no resto do país. São {STATES.length} estados e {CITIES.length} cidades no mapa (tecla{' '}
            <strong className="text-white">7</strong>).
          </p>
          <p>
            Cada filial traz o mercado da cidade, mas custa a abertura, aluguel e equipe todo mês, e leva {BRANCH_RAMP_MONTHS} meses para render tudo. Entrar em
            um estado novo cobra a inscrição estadual; numa região nova, um centro de distribuição. Quanto mais estados, mais cara fica a logística.
          </p>
        </Section>
        <Section icon={Landmark} title="Dinheiro: inflação, aplicação e seguro">
          <p>
            Todo mês a inflação encarece os custos e o preço médio do mercado: reajuste seus preços de vez em quando. Guarde dinheiro na{' '}
            <strong className="text-white">aplicação financeira</strong> (rende todo mês e cobre o caixa numa emergência) e contrate o{' '}
            <strong className="text-white">seguro empresarial</strong>, que devolve {Math.round(INSURANCE_COVERAGE * 100)}% do prejuízo de eventos ruins.
          </p>
          <p>
            Escolha o <strong className="text-white">fornecedor</strong> (econômico, padrão ou premium), crie um <strong className="text-white">programa de fidelidade</strong>{' '}
            e cumpra o <strong className="text-white">desafio do mês</strong>, uma meta nova a cada mês com prêmio em dinheiro.
          </p>
        </Section>
        <Section icon={Dices} title="Eventos">
          <p>
            Concorrentes, posts virais, crises, investidores... Quando algo acontece, um personagem vem falar com você. Suas escolhas têm
            consequências, e o jogo explica cada uma.
          </p>
        </Section>
        <Section icon={Trophy} title="Níveis e conquistas">
          <p>{LEVELS.map((l) => `${l.level}. ${l.title}`).join(' · ')}</p>
          <p>Cada fase libera novos canais, cargos, móveis e áreas da cidade. As missões guiam os primeiros passos e dão recompensas em dinheiro.</p>
        </Section>
        <Section icon={Flag} title="Como vencer">
          <p>
            Ao mesmo tempo: <strong className="text-white">{money(VICTORY_REVENUE)} de receita acumulada</strong>, nível{' '}
            <strong className="text-white">{LEVELS[VICTORY_LEVEL - 1].title}</strong>, presença em{' '}
            <strong className="text-white">{VICTORY_STATES} estados</strong> e <strong className="text-white">{VICTORY_STREAK} meses seguidos de lucro</strong>. Você
            tem até {MONTH_LIMIT} meses.
          </p>
        </Section>
        <Section icon={Skull} title="Como perder">
          <p>
            Se o caixa passar do limite do cheque especial ou as dívidas passarem do limite, a empresa vai à falência. Os limites crescem com o nível da empresa.
            Clientes ficam mais exigentes e os concorrentes reagem quando você cresce, e as crises são mais frequentes nas dificuldades altas.
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
