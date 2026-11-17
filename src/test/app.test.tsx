import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { advanceMonth, createGame } from '../game/engine';
import type { GameState } from '../game/types';
import { SAVE_KEY } from '../state/storage';
import { gameStore, uiStore } from '../state/store';
import { closeBusinessDay } from '../world/dayCycle';
import { openEventDialog } from '../world/actions';
import { balanced, draft, play } from './bots';

// O cenário 2D (Phaser) não roda no jsdom: troca por um quadro vazio.
vi.mock('../world/GameCanvas', () => ({ GameCanvas: () => <div data-testid="game-canvas" /> }));

function seed(state: GameState) {
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function saved(): GameState {
  return JSON.parse(window.localStorage.getItem(SAVE_KEY) ?? 'null');
}

const game = () => gameStore.get()!;

function readyGame(overrides: Partial<GameState> = {}): GameState {
  return { ...createGame({ ...draft('moda'), playerName: 'Ana', name: 'Vibe Store' }, 7), tutorialDone: true, ...overrides };
}

/** Abre o jogo salvo e espera a tela de jogo aparecer. */
async function continueGame(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'CONTINUAR' }));
  await screen.findByTestId('game-canvas', {}, { timeout: 8000 });
}

const setup = () => userEvent.setup({ pointerEventsCheck: 0 });

describe('tela inicial', () => {
  it('mostra título, frase e botões', async () => {
    const user = setup();
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('STARTUP TYCOON');
    expect(screen.getByText(/Seu negócio\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CONTINUAR' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'COMO JOGAR' }));
    expect(screen.getByRole('dialog', { name: 'Como jogar' })).toBeInTheDocument();
  });
});

describe('nova partida', () => {
  it('cria o personagem e a empresa passo a passo e entra no escritório', async () => {
    const user = setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'NOVO JOGO' }));
    expect(screen.getByText('Quem é você?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(screen.getByText(/Digite seu nome/)).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: /seu nome/ }), 'Ana');
    // criação de personagem
    await user.click(screen.getByRole('radio', { name: 'Cacheado' }));
    await user.click(within(screen.getByRole('radiogroup', { name: 'Personalidade empreendedora' })).getByRole('radio', { name: /Organizado/ }));
    await user.click(screen.getByRole('radio', { name: /Difícil/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));

    await user.click(screen.getByRole('radio', { name: /Alimentação/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));

    await user.type(screen.getByRole('textbox', { name: /Nome da empresa/ }), 'Doce Encanto');
    await user.type(screen.getByRole('textbox', { name: /Produto principal/ }), 'Brigadeiros');
    await user.type(screen.getByRole('textbox', { name: /Slogan/ }), 'Doçura em cada mordida');
    await user.type(screen.getByRole('textbox', { name: /Descrição da empresa/ }), 'Doces artesanais por encomenda');
    await user.type(screen.getByRole('textbox', { name: /Diferencial competitivo/ }), 'Receitas da família');
    await user.click(screen.getByRole('button', { name: /Continuar/ }));

    await user.click(screen.getByRole('radio', { name: /Agência de branding/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(screen.getByRole('radio', { name: /Premium/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));

    // 10.000 - 1.500 (abertura) - 1.800 (agência) - 3.000 (premium) - 0 (home office)
    expect(screen.getByText('Caixa para começar a operar').closest('tr')).toHaveTextContent('R$ 3.700');
    await user.click(screen.getByRole('button', { name: /Abrir minha empresa/ }));

    await screen.findByTestId('game-canvas', {}, { timeout: 8000 });
    const s = game();
    expect(s.company.name).toBe('Doce Encanto');
    expect(s.player.difficulty).toBe('dificil');
    expect(s.avatar.personality).toBe('organizado');
    expect(s.avatar.hairStyle).toBe('cacheado');
    // a missão "Crie sua primeira empresa" já vem concluída (+R$ 500)
    expect(s.cash).toBe(4200);
    expect(s.world.furniture.some((f) => f.type === 'mesa_fundador')).toBe(true);
    // a mentora dá as boas-vindas
    expect(await screen.findByText('Dona Rita', {}, { timeout: 3000 })).toBeInTheDocument();
  }, 20000);

  it('personagem feminina, barbearia e assistente de ideias preenchendo a empresa', async () => {
    const user = setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'NOVO JOGO' }));
    await user.type(screen.getByRole('textbox', { name: /seu nome/ }), 'Bia');
    await user.click(within(screen.getByRole('radiogroup', { name: 'Sexo' })).getByRole('radio', { name: 'Feminino' }));
    await user.click(screen.getByRole('radio', { name: 'Saia' }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(screen.getByRole('radio', { name: /Barbearia/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));

    await user.click(screen.getByRole('button', { name: 'Sugerir nomes' }));
    expect(screen.getByRole('button', { name: 'Outras ideias' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Preencher campos vazios' }));
    for (const label of [/Nome da empresa/, /Produto principal/, /Slogan/, /Descrição da empresa/, /Diferencial competitivo/])
      expect((screen.getByRole('textbox', { name: label }) as HTMLInputElement).value.length).toBeGreaterThan(2);
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(screen.queryByText(/Dê um nome para a empresa/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(screen.getByRole('button', { name: /Continuar/ }));
    await user.click(screen.getByRole('button', { name: /Abrir minha empresa/ }));
    await screen.findByTestId('game-canvas', {}, { timeout: 8000 });
    expect(game().company.segment).toBe('barbearia');
    expect(game().avatar.gender).toBe('feminino');
    expect(game().avatar.skirt).toBe(true);
    expect(game().world.furniture.some((f) => f.type === 'cadeira_barbeiro')).toBe(true);
  }, 20000);

  it('as dicas de boas-vindas podem ser percorridas até o fim', async () => {
    const user = setup();
    seed({ ...readyGame(), tutorialDone: false });
    await continueGame(user);
    await screen.findByText('Dona Rita', {}, { timeout: 3000 });
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Vamos lá!' }));
    expect(screen.queryByText('Dona Rita')).not.toBeInTheDocument();
    expect(game().tutorialDone).toBe(true);
  });
});

describe('jogo', () => {
  it('mostra o HUD com dinheiro, horário, dia e missão atual', async () => {
    const user = setup();
    seed(readyGame());
    await continueGame(user);
    expect(screen.getByTestId('hud-money')).toHaveTextContent('Saldo da empresa');
    expect(screen.getByTestId('hud-clock')).toHaveTextContent('08:00');
    expect(screen.getByTestId('hud-clock')).toHaveTextContent('Dia 1/10');
    expect(screen.getByTestId('hud-mission')).toHaveTextContent('Compre os primeiros móveis');
    // pausar e retomar o tempo
    await user.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(uiStore.get().speed).toBe(0);
    await user.click(screen.getByRole('button', { name: '2x' }));
    expect(uiStore.get().speed).toBe(2);
  });

  it('a barra de ferramentas abre as janelas e elas pausam o tempo', async () => {
    const user = setup();
    seed(readyGame());
    await continueGame(user);
    for (const [label, title] of [
      ['Construir', 'Construir'],
      ['Contratar', 'Contratar'],
      ['Comprar', 'Comprar'],
      ['Marketing', 'Marketing'],
      ['Missões', 'Missões'],
    ] as const) {
      await user.click(screen.getByRole('button', { name: label, pressed: false }));
      expect(screen.getByRole('dialog', { name: title })).toBeInTheDocument();
      expect(screen.getByText('Jogo pausado')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Fechar' }));
    }
    await user.click(screen.getByRole('button', { name: 'Empresa', pressed: false }));
    const computer = screen.getByRole('dialog', { name: 'Computador da empresa' });
    await user.click(within(computer).getByRole('button', { name: 'Finanças' }));
    expect(uiStore.get().computerApp).toBe('financas');
  });

  it('comprar um móvel entra no modo de posicionamento', async () => {
    const user = setup();
    seed(readyGame());
    await continueGame(user);
    await user.click(screen.getByRole('button', { name: 'Construir' }));
    await user.click(screen.getByTestId('build-arara'));
    expect(uiStore.get().buildItem).toBe('arara');
    expect(uiStore.get().panel).toBeNull();
    expect(screen.getByText(/Clique no piso para posicionar/)).toBeInTheDocument();
  });

  it('ampliar o escritório gasta dinheiro e aumenta o espaço', async () => {
    const user = setup();
    seed(readyGame({ cash: 9000 }));
    await continueGame(user);
    await user.click(screen.getByRole('button', { name: 'Construir' }));
    await user.click(screen.getByRole('tab', { name: 'Ampliar' }));
    await user.click(screen.getByRole('button', { name: /Ampliar por R\$\s2\.000/ }));
    expect(game().infraLevel).toBe(1);
    expect(game().cash).toBe(7000);
  });

  it('contratar coloca alguém na equipe e cumpre a missão quando é a vez dela', async () => {
    const user = setup();
    seed(readyGame({ world: { ...readyGame().world, missionsDone: ['empresa', 'moveis'] } }));
    await continueGame(user);
    await user.click(screen.getByRole('button', { name: 'Contratar' }));
    await user.click(within(screen.getByTestId('role-atendente')).getByRole('button', { name: 'Contratar' }));
    expect(game().employees.atendente).toBe(1);
    expect(game().world.missionsDone).toContain('funcionario');
    expect(await screen.findByText(/Missão concluída: Contrate seu primeiro funcionário/)).toBeInTheDocument();
  });

  it('marketing: ação rápida do dia e campanha mensal', async () => {
    const user = setup();
    seed(readyGame());
    await continueGame(user);
    await user.click(screen.getByRole('button', { name: 'Marketing' }));
    const followers = game().followers;
    await user.click(screen.getByTestId('quick-post'));
    expect(game().followers).toBeGreaterThan(followers);
    expect(uiStore.get().panel).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Marketing' }));
    expect(screen.getByTestId('quick-post')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Criar campanha' }));
    expect(game().campaigns).toHaveLength(1);
  });

  it('eventos aparecem como conversa com escolhas e consequência', async () => {
    const user = setup();
    seed(readyGame({ month: 4, cash: 8000, pendingEvent: { eventId: 'concorrente', month: 4 } }));
    await continueGame(user);
    act(() => openEventDialog());
    const dialog = screen.getByRole('dialog', { name: /Conversa com/ });
    expect(dialog).toHaveTextContent('Concorrente novo no mercado');
    await user.click(within(dialog).getByRole('button', { name: /Investir em diferenciação/ }));
    expect(game().cash).toBe(6500);
    expect(game().pendingEvent).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.queryByRole('dialog', { name: /Conversa com/ })).not.toBeInTheDocument();
  });

  it('o fim do expediente fecha o dia e o fim do mês mostra o relatório', async () => {
    const user = setup();
    seed(readyGame());
    await continueGame(user);
    act(() => void closeBusinessDay());
    expect(game().world.day).toBe(2);
    expect(screen.getByTestId('hud-clock')).toHaveTextContent('Dia 2/10');

    act(() => gameStore.set({ ...game(), world: { ...game().world, day: 10 } }));
    act(() => void closeBusinessDay());
    const report = await screen.findByRole('dialog', { name: 'Mês 1' });
    expect(within(report).getByText('O que você aprendeu este mês')).toBeInTheDocument();
    expect(game().month).toBe(2);
    expect(game().world.day).toBe(1);
    await user.click(within(report).getByRole('button', { name: /Planejar o mês 2|há um evento/ }));
    expect(screen.queryByRole('dialog', { name: 'Mês 1' })).not.toBeInTheDocument();
    expect(game().unseenReport).toBe(false);
  });

  it('relatório pendente abre ao continuar o jogo', async () => {
    const user = setup();
    seed(advanceMonth(readyGame()).state);
    await continueGame(user);
    expect(await screen.findByRole('dialog', { name: 'Mês 1' })).toBeInTheDocument();
  });

  it('salva automaticamente e sai para o menu pela pausa', async () => {
    const user = setup();
    seed(readyGame());
    await continueGame(user);
    await user.click(screen.getByRole('button', { name: 'Marketing' }));
    await user.click(screen.getByTestId('quick-post'));
    await waitFor(() => expect(saved().followers).toBe(game().followers));
    await user.click(screen.getByRole('button', { name: 'Menu do jogo' }));
    expect(screen.getByRole('dialog', { name: 'Jogo pausado' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Sair para o menu/ }));
    expect(screen.getByRole('button', { name: 'CONTINUAR' })).toBeEnabled();
    expect(screen.getByText('Vibe Store')).toBeInTheDocument();
  });
});

describe('fim de jogo', () => {
  it('relatório final com pontuação e classificação', async () => {
    const user = setup();
    const won = play('beleza', balanced).state;
    seed({ ...won, unseenReport: false });
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'CONTINUAR' }));
    expect(await screen.findByText('Vitória!')).toBeInTheDocument();
    expect(screen.getByText('Pontuação final')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continuar jogando' }));
    expect(game().freePlay).toBe(true);
    expect(game().phase).toBe('playing');
  });

  it('novo jogo pede confirmação antes de apagar a partida', async () => {
    const user = setup();
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
