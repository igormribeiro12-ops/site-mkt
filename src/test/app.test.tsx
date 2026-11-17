import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { createGame } from '../game/engine';
import type { GameState } from '../game/types';
import { SAVE_KEY } from '../state/storage';
import { balanced, draft, play } from './bots';

function seed(state: GameState) {
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function saved(): GameState {
  return JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? 'null');
}

function readyGame(overrides: Partial<GameState> = {}): GameState {
  return { ...createGame({ ...draft('moda'), playerName: 'Ana', name: 'Vibe Store' }, 7), tutorialDone: true, ...overrides };
}

describe('tela inicial', () => {
  it('mostra título, frase e botões', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('STARTUP TYCOON');
    expect(screen.getByText(/Seu negócio\./)).toBeInTheDocument();
    expect(screen.getByText(/Você tem uma ideia e uma oportunidade/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CONTINUAR' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'COMO JOGAR' }));
    expect(screen.getByRole('dialog', { name: 'Como jogar' })).toBeInTheDocument();
  });
});

describe('nova partida', () => {
  it('cria a empresa passo a passo, com validação e capital em tempo real', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'NOVO JOGO' }));

    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(screen.getByText(/Digite seu nome/)).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: /seu nome/ }), 'Ana');
    await user.click(screen.getByRole('radio', { name: /Difícil/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));

    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(screen.getByText(/Escolha o mercado/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Alimentação/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));

    await user.type(screen.getByRole('textbox', { name: /Nome da empresa/ }), 'Doce Encanto');
    await user.type(screen.getByRole('textbox', { name: /Produto principal/ }), 'Brigadeiros');
    await user.click(screen.getByRole('button', { name: /Gerar ideias de slogan/ }));
    await user.type(screen.getByRole('textbox', { name: /Slogan/ }), 'Doçura em cada mordida');
    await user.type(screen.getByRole('textbox', { name: /Descrição da empresa/ }), 'Doces artesanais por encomenda');
    await user.type(screen.getByRole('textbox', { name: /Diferencial competitivo/ }), 'Receitas da família');
    await user.click(screen.getByRole('button', { name: /Continuar/ }));

    // Identidade visual: agência custa R$ 1.800.
    await user.click(screen.getByRole('radio', { name: /Agência de branding/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(screen.getByRole('radio', { name: /Premium/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));

    // 10.000 - 1.500 (abertura) - 1.800 (agência) - 3.000 (premium) - 0 (home office)
    expect(screen.getByText('Caixa para começar a operar').closest('tr')).toHaveTextContent('R$ 3.700');
    await user.click(screen.getByRole('button', { name: /Abrir minha empresa/ }));

    expect(await screen.findByRole('dialog', { name: /Bem-vindo\(a\), Ana!/ })).toBeInTheDocument();
    const s = saved();
    expect(s.company.name).toBe('Doce Encanto');
    expect(s.cash).toBe(3700);
    expect(s.player.difficulty).toBe('dificil');
    expect(s.quality).toBe(75);
  });

  it('o tutorial pode ser percorrido até o fim', async () => {
    const user = userEvent.setup();
    seed({ ...readyGame(), tutorialDone: false });
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'CONTINUAR' }));
    for (let i = 0; i < 6; i++) await user.click(await screen.findByRole('button', { name: 'Próximo' }));
    await user.click(screen.getByRole('button', { name: /Começar a jogar/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(saved().tutorialDone).toBe(true);
  });
});

describe('rodadas', () => {
  it('cria campanha, avança o mês e mostra o relatório educativo', async () => {
    const user = userEvent.setup();
    seed(readyGame());
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'CONTINUAR' }));
    await user.click(screen.getAllByRole('button', { name: 'Marketing' })[0]);
    await user.click(screen.getByRole('button', { name: 'Criar campanha' }));
    expect(saved().campaigns).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /Avançar para o mês 2/ }));
    const report = await screen.findByRole('dialog', { name: 'Mês 1' }, { timeout: 4000 });
    expect(within(report).getByText('O que você aprendeu este mês')).toBeInTheDocument();
    expect(within(report).getByText('Resultado das campanhas')).toBeInTheDocument();
    expect(within(report).getByText(/CAC|ROI/, { selector: 'span' })).toBeInTheDocument();
    const s = saved();
    expect(s.month).toBe(2);
    expect(s.history).toHaveLength(1);
    expect(s.cash).not.toBe(readyGame().cash);

    await user.click(within(report).getByRole('button', { name: /Planejar o mês 2|há um evento/ }));
    expect(screen.queryByRole('dialog', { name: 'Mês 1' })).not.toBeInTheDocument();
  });

  it('eventos exigem uma decisão e mostram a consequência', async () => {
    const user = userEvent.setup();
    seed(readyGame({ month: 4, cash: 8000, pendingEvent: { eventId: 'concorrente', month: 4 } }));
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'CONTINUAR' }));
    const dialog = await screen.findByRole('dialog', { name: 'Concorrente novo no mercado' });
    expect(screen.getByRole('button', { name: /Avançar para o mês/ })).toBeDisabled();
    await user.click(within(dialog).getByRole('button', { name: /Investir em diferenciação/ }));
    expect(await screen.findByRole('dialog', { name: 'Concorrente novo no mercado' })).toHaveTextContent('Consequência');
    expect(saved().cash).toBe(6500);
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('button', { name: /Avançar para o mês 5/ })).toBeEnabled();
  });

  it('pausa e sai para o menu, mantendo o jogo salvo', async () => {
    const user = userEvent.setup();
    seed(readyGame());
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'CONTINUAR' }));
    await user.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(screen.getByRole('dialog', { name: 'Jogo pausado' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Sair para o menu/ }));
    expect(screen.getByRole('button', { name: 'CONTINUAR' })).toBeEnabled();
    expect(screen.getByText('Vibe Store')).toBeInTheDocument();
  });

  it('contratar e investir mudam o saldo na hora', async () => {
    const user = userEvent.setup();
    seed(readyGame());
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'CONTINUAR' }));
    await user.click(screen.getAllByRole('button', { name: 'Produto e preço' })[0]);
    const before = saved().cash;
    await user.click(screen.getByRole('button', { name: /Investir R\$\s1\.000 em melhorias/ }));
    expect(saved().cash).toBe(before - 1000);
    await user.click(screen.getAllByRole('button', { name: 'Equipe e expansão' })[0]);
    await user.click(screen.getAllByRole('button', { name: 'Contratar' })[0]);
    expect(saved().employees.atendente).toBe(1);
  });
});

describe('fim de jogo', () => {
  it('relatório final com pontuação e classificação', async () => {
    const user = userEvent.setup();
    const won = play('beleza', balanced).state;
    seed({ ...won, unseenReport: false });
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'CONTINUAR' }));
    expect(await screen.findByText('Vitória!')).toBeInTheDocument();
    expect(screen.getByText('Pontuação final')).toBeInTheDocument();
    expect(screen.getByText('Estratégia de marketing')).toBeInTheDocument();
    expect(screen.getByText('Principais decisões')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continuar jogando' }));
    expect(saved().freePlay).toBe(true);
    expect(saved().phase).toBe('playing');
  });

  it('novo jogo pede confirmação antes de apagar a partida', async () => {
    const user = userEvent.setup();
    seed(readyGame());
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'NOVO JOGO' }));
    const dialog = screen.getByRole('dialog', { name: 'Começar um novo jogo?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(saved()).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'NOVO JOGO' }));
    await user.click(screen.getByRole('button', { name: 'Apagar e começar' }));
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(screen.getByText('Quem é você?')).toBeInTheDocument();
  });
});
