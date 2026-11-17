# STARTUP TYCOON — Construa seu Império

> *Sua ideia. Seu negócio. Seu império.*

Jogo 2D de simulação de negócios para aulas de Marketing Digital. O aluno cria um personagem, abre uma pequena empresa com **R$ 10.000** de capital fictício e a vê crescer dentro de um cenário animado: anda pelo escritório, atende clientes, compra móveis, contrata funcionários, faz marketing, enfrenta eventos e expande pela cidade.

Tudo roda no navegador: **sem cadastro, sem servidor e sem APIs pagas**. A partida é salva automaticamente no `localStorage` do dispositivo. Toda a arte (personagens, móveis, prédios, efeitos) é desenhada pelo próprio código — não há imagens de terceiros.

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

## Como se joga

### Controles

| Ação | Teclado / mouse |
|---|---|
| Andar | Setas ou **W A S D** — ou clique/toque no chão |
| Interagir | Chegue perto e aperte **E** (ou Espaço), ou clique no objeto |
| Janelas | **1** Construir · **2** Contratar · **3** Comprar · **4** Marketing · **5** Empresa · **6** Missões |
| Tempo | **P** pausa · botões 1x / 2x / 4x no topo |
| Menu | **Esc** |

### O começo

1. **Personagem:** nome, tom de pele, cabelo, cor do cabelo, estilo, roupa e **personalidade empreendedora** (criativo, negociador, organizado ou visionário — cada uma dá um bônus).
2. **Empresa:** mercado (tecnologia, alimentação, moda, beleza, educação, comércio, serviços ou entretenimento), nome, slogan (com gerador), identidade visual e operação inicial.
3. **Escritório inicial:** mesa com computador, cadeira, porta, janelas, decoração e os primeiros móveis do seu tipo de negócio (fogão e mesa para restaurante, arara para loja de roupas, cadeira de salão para beleza…).
4. A **mentora** do bairro explica o básico e as **missões** guiam os primeiros passos.

### O dia a dia

- **Relógio:** a loja abre às 8h e fecha às 18h. Há amanhecer, entardecer e noite (com postes e luminárias acesos). Abrir qualquer janela pausa o tempo.
- **Clientes** entram pela porta, olham os produtos, sentam, fazem fila no caixa, pagam (moedas e valor sobem na tela) e vão embora. Quando falta capacidade, alguns vão embora irritados. Curiosos do bairro também passam para dar uma olhada.
- **Você trabalha:** no computador (melhora o produto), no balcão (melhora o atendimento) ou na produção.
- **Computador da empresa:** o sistema de gestão com painel, mercado, campanhas, vendas, produto e preço, equipe, finanças e conquistas.
- **Fechamento:** no fim do dia o resultado aparece no cenário; a cada 10 dias o mês fecha com um **relatório educativo**.

### Crescer

- **Construir:** móveis por categoria (produção, atendimento, equipamentos, decoração) posicionados no piso com prévia verde/vermelha; modo **Organizar** para mover ou vender; **ampliar o espaço** (o cenário cresce) e **decorar** paredes e piso.
- **Contratar:** atendente, vendedor, marketing, desenvolvedor e gerente. Cada funcionário aparece, chega às 8h, vai até um posto livre e trabalha.
- **Marketing:** ações rápidas que acontecem no cenário (publicar conteúdo, gravar vídeo, panfletos na rua, influenciador, feira de negócios) e campanhas mensais em Instagram, TikTok, Google Ads, Facebook, WhatsApp, influenciadores e SEO. Campanhas que dão certo trazem clientes que você vê entrando.
- **Comprar:** ampliar o escritório, expandir o mercado (libera o centro da cidade), abrir novas unidades, investir em qualidade, lançar produtos e ajustar o preço.
- **Cidade:** saia pela porta para o bairro: banco (empréstimos), gráfica (panfletos), agência criativa, loja de móveis, imobiliária e, mais tarde, centro de eventos, centro empresarial, filiais, outdoor e a torre da empresa. A sede cresce em andares com a empresa.

### Eventos

São 20 eventos (concorrente novo, post viral, crise de custos, fornecedor, investidor-anjo, fiscalização, imprensa, pedido grande e outros). Um personagem vem até você e conversa; cada escolha tem consequências explicadas.

### Fases da empresa

Pequeno empreendedor → Pequena empresa → Empresa em crescimento → Empresa consolidada → Grande companhia → Império empresarial.

### Vitória e derrota

- **Vitória:** R$ 100.000 de receita acumulada **e** a fase *Grande companhia* **e** 3 meses seguidos de lucro. Depois de vencer, dá para continuar no modo livre.
- **Derrota:** caixa abaixo do limite do cheque especial ou dívidas acima do limite (falência).
- **Prazo:** 36 meses.

O **relatório final** mostra o desempenho financeiro, a estratégia de marketing, as principais decisões, a pontuação e a classificação do empreendedor.

## Regras da simulação

As fórmulas estão em [`src/game/simulation.ts`](src/game/simulation.ts) e são **determinísticas**: as vendas dependem de preço, qualidade, reputação, concorrência, demanda, marketing, capacidade, atendimento, móveis e do trabalho do jogador. A economia é calculada por dia útil (10 por mês); a única variação aleatória é uma oscilação de mercado de ±5%, sorteada com a semente da partida.

Os clientes que aparecem no cenário são uma representação visual dessa simulação: no início do expediente o jogo calcula o dia e distribui os compradores pelo horário. Quando você muda algo no meio do dia (campanha, preço, móveis), os próximos clientes são recalculados.

O equilíbrio é verificado por "jogadores automáticos" nos testes ([`src/test/bots.ts`](src/test/bots.ts)): uma estratégia equilibrada vence nos 8 mercados, enquanto não fazer nada ou gastar sem planejamento leva à falência.

```bash
BALANCE=/tmp/equilibrio.tsv npx vitest run src/test/balance.report.test.ts
```

## Material da aula

O material de apoio sobre Marketing Digital continua em [`public/aula.html`](public/aula.html) e abre pelo link **Material da aula** na tela inicial.

## Estrutura do código

```
src/
  game/         regras: dados, simulação diária, móveis, missões, eventos, conquistas, pontuação e ações
  world/        motor 2D (Phaser): cenas do escritório e da cidade, personagens, relógio, arte gerada em canvas
  state/        estado compartilhado entre o jogo 2D e a interface, salvamento automático e avisos
  screens/      tela inicial, criação de personagem e empresa, HUD, barra de ferramentas, janelas e relatório final
  components/   componentes visuais (logotipo, gráficos, painéis, modais)
  test/         testes das telas e jogadores automáticos
```

Em desenvolvimento (`npm run dev`), `art-preview.html` mostra toda a arte do jogo e o console expõe `__tycoon.quickStart('alimentacao')` para começar uma partida de teste.

Tecnologias: Phaser 3, React, TypeScript, Tailwind CSS, Lucide Icons, Recharts e Vite. Se o navegador não tiver aceleração de vídeo, o jogo desenha com Canvas 2D automaticamente.
