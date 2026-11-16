# Startup Lab — Crie sua Empresa

Laboratório de empreendedorismo para aulas de Marketing Digital. Cada aluno cria uma empresa fictícia, do nome à apresentação final, passando por marca, público-alvo, produtos, estratégia de marketing, publicações e planejamento financeiro.

Tudo funciona no navegador, **sem cadastro, sem banco de dados e sem APIs pagas**. O progresso fica salvo no `localStorage` do dispositivo usado pelo aluno.

## Como rodar

Requer [Node.js](https://nodejs.org) 20 ou superior.

```bash
npm install
npm run dev        # abre em http://localhost:5173
```

Outros comandos:

| Comando | O que faz |
|---|---|
| `npm run build` | Verifica os tipos e gera a versão final na pasta `dist/` |
| `npm run preview` | Serve a pasta `dist/` localmente para conferir a versão final |
| `npm test` | Roda os testes automatizados (cálculos, validações e navegação entre etapas) |

## Publicar para a turma

A pasta `dist/` é um site estático e funciona em qualquer hospedagem (GitHub Pages, Netlify, Vercel, servidor da escola). A navegação usa `#/` nos endereços, então não é preciso configurar o servidor. Basta enviar o conteúdo de `dist/`.

## Etapas da atividade

1. **Criação da empresa**: nome, fundador, segmento, problema, solução e diferencial (gera um *pitch* automático).
2. **Identidade da marca**: cores, estilo, símbolo, slogan (com gerador local de sugestões) e prévia do logotipo.
3. **Público-alvo**: idade, localização, interesses, necessidades, problemas, poder de compra e canais, com o cartão **Meu Cliente Ideal**.
4. **Produtos e serviços**: vitrine digital com cadastro, edição e exclusão.
5. **Marketing digital**: canais, divulgação, estratégia de conteúdo, frequência, investimento, objetivo e **calendário editorial**.
6. **Criador de publicações**: campanhas com prévia simulada de Instagram, TikTok, Facebook, Google, WhatsApp Business e site.
7. **Planejamento financeiro**: receita, custos, resultado, margem, ponto de equilíbrio e saldo em 12 meses (simulação educacional).
8. **Painel da empresa** e **Apresentar minha empresa**: página de apresentação em modo documento ou slides, com botão para imprimir ou salvar em PDF.

## Dados dos alunos

- Cada navegador guarda **um projeto**. Os dados não são enviados para nenhum servidor nem compartilhados entre alunos.
- Em computadores compartilhados ou que são limpos ao fim da aula, o aluno pode usar o menu **⋯ → Baixar cópia de segurança** para salvar um arquivo `.json` e depois **Restaurar cópia de segurança** em outro dispositivo.
- **⋯ → Reiniciar projeto** apaga tudo, depois de uma confirmação.

## Material da aula

O material de apoio sobre Marketing Digital que estava neste repositório continua disponível em [`public/aula.html`](public/aula.html). No site publicado, ele abre pelo link **Material da aula**.

## Estrutura do código

```
src/
  components/   componentes reutilizáveis (ui, layout, marca, público, produtos, marketing, publicações, financeiro)
  context/      estado do projeto (salvo no localStorage) e avisos
  lib/          regras: validação, progresso, cálculos financeiros, gerador de slogans, armazenamento
  pages/        página inicial, etapas, painel e apresentação
  test/         testes de navegação e dados de teste
```

Tecnologias: React, TypeScript, Tailwind CSS, Lucide Icons, React Router e Vite. As fontes são incluídas no próprio projeto, então funcionam sem internet depois de carregadas.
