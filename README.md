# STARTUP TYCOON — Construa seu Império

> *Sua ideia. Seu negócio. Seu império.*

Simulador de empreendedorismo e gestão para aulas de Marketing Digital. O aluno começa com **R$ 10.000** de capital fictício, cria uma empresa e joga mês a mês: investe em marketing, define preço, contrata, expande e enfrenta eventos. No fim, recebe um relatório com pontuação e classificação.

Tudo roda no navegador: **sem cadastro, sem servidor e sem APIs pagas**. A partida é salva automaticamente no `localStorage` do dispositivo.

## Como rodar

Requer [Node.js](https://nodejs.org) 20 ou superior.

```bash
npm install
npm run dev        # abre em http://localhost:5173
```

| Comando | O que faz |
|---|---|
| `npm run build` | Verifica os tipos e gera a versão final em `dist/` |
| `npm run preview` | Serve a pasta `dist/` localmente |
| `npm test` | Roda os testes (simulação, equilíbrio do jogo e telas) |

A pasta `dist/` é um site estático: pode ser publicada no GitHub Pages, Netlify, Vercel ou no servidor da escola.

## Como o jogo funciona

1. **Novo jogo:** nome do jogador e dificuldade (Fácil, Normal ou Difícil).
2. **Criação da empresa:** escolha do mercado (8 segmentos com demanda, concorrência, poder de compra, tendência e dificuldade de entrada), nome, slogan (com gerador local), descrição, produto e diferencial.
3. **Identidade visual:** cores, forma, símbolo, tipografia e três modelos de logotipo. O pacote de design custa dinheiro e dá reputação.
4. **Operação inicial:** estrutura, qualidade do produto e preço. O capital é atualizado em tempo real.
5. **Rodadas mensais:** o jogador analisa o mercado e as finanças, decide e clica em **Avançar mês**. O jogo calcula despesas, vendas, receita, clientes e reputação, aplica eventos e mostra um **relatório mensal com explicações educativas**.

### Áreas do jogo

- **Painel:** saldo, receita, despesas, lucro, clientes, seguidores, nível, valor da empresa, gráficos e missão.
- **Mercado:** demanda, participação, concorrência, perfis de consumidores, persona e afinidade com cada canal.
- **Marketing:** Instagram, TikTok, Google Ads, Facebook, WhatsApp Business, marketing de influência e SEO. Cada canal tem custo, alcance, público, conversão e eficiência. As campanhas têm objetivo (reconhecimento, seguidores, leads ou vendas) e estimativa antes de confirmar.
- **Vendas:** clientes, produtos vendidos, receita, ticket médio, conversão, satisfação e capacidade.
- **Produto e preço:** preço e posicionamento, qualidade (P&D) e novos produtos.
- **Equipe e expansão:** atendente, vendedor, profissional de marketing, desenvolvedor e gerente; infraestrutura, novas unidades e novos mercados.
- **Finanças:** demonstrativo de resultado, fluxo de caixa, empréstimos e histórico.
- **Conquistas:** 6 níveis com desbloqueios, 16 conquistas, pontuação e decisões.

### Eventos

São 20 eventos (concorrente novo, campanha viral, crise de custos, investidor-anjo, reclamação viral, fiscalização, pedido grande e outros). Cada escolha tem consequências e uma explicação.

### Vitória e derrota

- **Vitória:** R$ 100.000 de receita acumulada **e** nível *Líder de mercado* **e** 3 meses seguidos de lucro. Depois de vencer, dá para continuar no modo livre.
- **Derrota:** caixa abaixo do limite do cheque especial ou dívidas acima do limite (falência).
- **Prazo:** 36 meses.

O **relatório final** mostra o desempenho financeiro, a estratégia de marketing por canal, as principais decisões, a pontuação (saúde financeira, marketing, satisfação, crescimento e inovação) e a classificação do empreendedor. Ele pode ser impresso ou salvo em PDF.

## Regras da simulação

Todas as fórmulas estão em [`src/game/simulation.ts`](src/game/simulation.ts) e são **determinísticas**: as vendas dependem de preço, qualidade, reputação, concorrência, demanda, marketing, capacidade e atendimento. A única variação aleatória é uma oscilação de mercado de ±5%, sorteada com a semente da partida. Os eventos são sorteados da mesma forma, com chances que dependem da situação da empresa.

O equilíbrio é verificado por "jogadores automáticos" nos testes ([`src/test/bots.ts`](src/test/bots.ts)):

- uma estratégia equilibrada vence nos 8 mercados (em média, entre 11 e 16 meses);
- não fazer nada ou gastar sem planejamento leva à falência.

Para ver a tabela completa de equilíbrio:

```bash
BALANCE=/tmp/equilibrio.tsv npx vitest run src/test/balance.report.test.ts
```

## Material da aula

O material de apoio sobre Marketing Digital continua em [`public/aula.html`](public/aula.html) e abre pelo link **Material da aula** na tela inicial.

## Estrutura do código

```
src/
  game/         regras do jogo: dados, simulação, eventos, conquistas, pontuação e ações
  state/        estado da partida, salvamento automático e avisos
  components/   componentes visuais (logotipo, gráficos, painéis, modais)
  screens/      tela inicial, criação da empresa, jogo (abas, relatório, eventos, tutorial) e relatório final
  test/         testes das telas e jogadores automáticos
```

Tecnologias: React, TypeScript, Tailwind CSS, Lucide Icons, Recharts e Vite.
