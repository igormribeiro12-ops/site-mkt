import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { STORAGE_KEY } from '../lib/storage';
import { makeCompleteProject } from './fixtures';
import type { Project } from '../types';

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function stored(): Project {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
}

function seed(project: Project) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
}

const h1 = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name });

async function fillCompanyStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: /Nome da empresa/ }), 'Doce Encanto');
  await user.type(screen.getByRole('textbox', { name: /fundador/i }), 'Maria');
  await user.click(screen.getByRole('radio', { name: /Alimentação/ }));
  await user.type(screen.getByRole('textbox', { name: /Descrição da empresa/ }), 'Confeitaria on-line de doces artesanais.');
  await user.type(screen.getByRole('textbox', { name: /Qual problema/ }), 'Falta de doces caseiros no bairro.');
  await user.type(screen.getByRole('textbox', { name: /Qual produto ou serviço/ }), 'Brigadeiros gourmet.');
  await user.type(screen.getByRole('textbox', { name: /diferencial competitivo/ }), 'Receitas da família.');
}

describe('navegação entre etapas', () => {
  it('a tela inicial leva à etapa 1', async () => {
    const user = userEvent.setup();
    renderApp();
    expect(screen.getByRole('heading', { level: 1, name: /Sua ideia pode se tornar uma empresa/ })).toBeInTheDocument();
    expect(screen.getByText(/Crie sua marca, desenvolva seu negócio/)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /Criar minha empresa/ })[0]);
    expect(await h1('Criação da empresa')).toBeInTheDocument();
  });

  it('bloqueia o avanço quando faltam campos obrigatórios', async () => {
    const user = userEvent.setup();
    renderApp('/etapa/empresa');
    await user.click(screen.getByRole('button', { name: /Salvar e continuar/ }));
    expect(screen.getByText('Dê um nome para a sua empresa.')).toBeInTheDocument();
    expect(screen.getByText('Escolha o segmento de atuação.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Criação da empresa' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/Faltam 7 itens obrigatórios/);
  });

  it('avança, volta e mantém os dados; salva no navegador', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(screen.getAllByRole('button', { name: /Criar minha empresa/ })[0]);
    await h1('Criação da empresa');
    await fillCompanyStep(user);

    expect(stored().company.name).toBe('Doce Encanto');

    await user.click(screen.getByRole('button', { name: /Salvar e continuar/ }));
    expect(await h1('Identidade da marca')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Voltar: Empresa/ }));
    expect(await h1('Criação da empresa')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Nome da empresa/ })).toHaveValue('Doce Encanto');
    expect(screen.getByRole('radio', { name: /Alimentação/ })).toBeChecked();
  }, 20000);

  it('permite pular etapas pelo menu lateral e mostra o progresso', async () => {
    const user = userEvent.setup();
    renderApp('/etapa/empresa');
    const nav = screen.getByRole('navigation', { name: /Etapas da criação/ });
    await user.click(within(nav).getByRole('link', { name: /Planejamento financeiro/ }));
    expect(await h1('Planejamento financeiro')).toBeInTheDocument();
    await user.click(within(nav).getByRole('link', { name: /Público-alvo/ }));
    expect(await h1('Público-alvo')).toBeInTheDocument();
    expect(within(nav).getByText('0%')).toBeInTheDocument();
  });

  it('percorre todas as etapas de um projeto completo até o painel', async () => {
    const user = userEvent.setup();
    seed(makeCompleteProject());
    renderApp('/etapa/empresa');
    const titles = ['Identidade da marca', 'Público-alvo', 'Produtos e serviços', 'Marketing digital', 'Criador de publicações', 'Planejamento financeiro'];
    for (const title of titles) {
      await user.click(screen.getByRole('button', { name: /Salvar e continuar/ }));
      expect(await h1(title)).toBeInTheDocument();
    }
    await user.click(screen.getByRole('button', { name: /Salvar e ver o painel/ }));
    expect(await h1('Painel da empresa')).toBeInTheDocument();
    expect(screen.getByText(/7 de 7 etapas completas/, { selector: 'p' })).toBeInTheDocument();
  });

  it('redireciona etapas inexistentes para a etapa 1', async () => {
    renderApp('/etapa/nao-existe');
    expect(await h1('Criação da empresa')).toBeInTheDocument();
  });
});

describe('persistência', () => {
  it('recupera o projeto salvo ao abrir de novo', async () => {
    seed(makeCompleteProject());
    renderApp('/');
    expect(screen.getAllByText('Doce Encanto').length).toBeGreaterThan(0);
    expect(screen.getByText('100% concluído')).toBeInTheDocument();
  });

  it('reinicia o projeto somente após confirmação', async () => {
    const user = userEvent.setup();
    seed(makeCompleteProject());
    renderApp('/painel');
    await user.click(screen.getByRole('button', { name: /Mais opções/ }));
    await user.click(screen.getByRole('menuitem', { name: /Reiniciar projeto/ }));
    const dialog = screen.getByRole('dialog', { name: /Reiniciar o projeto/ });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(stored().company.name).toBe('Doce Encanto');

    await user.click(screen.getByRole('button', { name: /Mais opções/ }));
    await user.click(screen.getByRole('menuitem', { name: /Reiniciar projeto/ }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Sim, apagar tudo/ }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(await screen.findByRole('heading', { level: 1, name: /Sua ideia pode se tornar/ })).toBeInTheDocument();
  });
});

describe('módulos', () => {
  it('cadastra, edita e exclui produtos', async () => {
    const user = userEvent.setup();
    renderApp('/etapa/produtos');
    expect(screen.getByText('Sua vitrine está vazia')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Cadastrar o primeiro item/ }));
    let dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Adicionar à vitrine/ }));
    expect(within(dialog).getByText('Dê um nome ao produto ou serviço.')).toBeInTheDocument();

    await user.type(within(dialog).getByRole('textbox', { name: /^Nome/ }), 'Bolo de pote');
    await user.type(within(dialog).getByRole('textbox', { name: /Preço/ }), '12,50');
    await user.type(within(dialog).getByRole('textbox', { name: /Descrição/ }), 'Bolo de pote de chocolate.');
    await user.click(within(dialog).getByRole('button', { name: 'Produto' }));
    await user.type(within(dialog).getByRole('textbox', { name: /Benefícios/ }), 'Prático');
    await user.type(within(dialog).getByRole('textbox', { name: /Diferenciais/ }), 'Receita da avó');
    await user.click(within(dialog).getByRole('button', { name: /Adicionar à vitrine/ }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bolo de pote' })).toBeInTheDocument();
    expect(screen.getByText('R$ 12,50')).toBeInTheDocument();
    expect(stored().products[0].price).toBe(12.5);

    await user.click(screen.getByRole('button', { name: 'Editar Bolo de pote' }));
    dialog = screen.getByRole('dialog');
    const name = within(dialog).getByRole('textbox', { name: /^Nome/ });
    await user.clear(name);
    await user.type(name, 'Bolo de pote especial');
    await user.click(within(dialog).getByRole('button', { name: /Salvar alterações/ }));
    expect(screen.getByRole('heading', { name: 'Bolo de pote especial' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Excluir Bolo de pote especial' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }));
    expect(screen.getByText('Sua vitrine está vazia')).toBeInTheDocument();
    expect(stored().products).toHaveLength(0);
  });

  it('gera slogans e usa uma sugestão', async () => {
    const user = userEvent.setup();
    seed(makeCompleteProject());
    renderApp('/etapa/marca');
    await user.click(screen.getByRole('button', { name: /Gerar sugestões/ }));
    const first = screen.getAllByRole('button', { name: /Usar$/ })[0];
    const text = first.querySelector('span')!.textContent!;
    await user.click(first);
    expect(screen.getByRole('textbox', { name: /Slogan da empresa/ })).toHaveValue(text);
  });

  it('salva uma campanha e mostra a prévia', async () => {
    const user = userEvent.setup();
    const project = makeCompleteProject();
    project.campaigns = [];
    seed(project);
    renderApp('/etapa/publicacoes');
    expect(screen.getByText('Nenhuma campanha salva ainda')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: /Nome da campanha/ }), 'Promo de Natal');
    await user.click(screen.getByRole('button', { name: /Compre agora/ }));
    await user.click(screen.getByRole('button', { name: /Montar texto com AIDA/ }));
    expect((screen.getByRole('textbox', { name: /Texto da publicação/ }) as HTMLTextAreaElement).value).toContain('Doce Encanto');
    await user.click(screen.getByRole('button', { name: /Salvar campanha/ }));
    expect(stored().campaigns).toHaveLength(1);
    expect(stored().campaigns[0].name).toBe('Promo de Natal');
    expect(screen.getByText('Promo de Natal')).toBeInTheDocument();
  });

  it('calcula o financeiro automaticamente', async () => {
    seed(makeCompleteProject());
    renderApp('/etapa/financeiro');
    expect(screen.getAllByText(/simulação educacional/i, { selector: 'strong' }).length).toBeGreaterThan(0);
    expect(screen.getByText('R$ 3.000,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.600,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.400,00')).toBeInTheDocument();
    expect(screen.getByText('46,7%')).toBeInTheDocument();
  });

  it('apresentação mostra as seções e imprime', async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    seed(makeCompleteProject());
    renderApp('/apresentacao');
    for (const label of ['Capa', 'Identidade visual', 'O negócio', 'Produtos e serviços', 'Público-alvo', 'Estratégia de marketing', 'Campanha de divulgação', 'Planejamento financeiro']) {
      expect(screen.getByRole('region', { name: label })).toBeInTheDocument();
    }
    await user.click(screen.getByRole('button', { name: /Imprimir/ }));
    expect(print).toHaveBeenCalled();

    await user.click(screen.getByRole('radio', { name: /Slides/ }));
    expect(screen.getByText(/1\/9 · Capa/)).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText(/2\/9 · Identidade visual/)).toBeInTheDocument();
  });
});
