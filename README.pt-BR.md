# StoreReady

> Mostre seu app do seu jeito, de forma simples — capturas para a App Store.

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · **Português (Brasil)**

**https://app-ready.store**

O StoreReady é um editor gratuito, no navegador, para capturas promocionais da App Store. Posicione título, subtítulo e mockups de dispositivos (celulares, tablets, relógios), adicione suas próprias capturas e exporte PNGs exatos nos tamanhos da App Store. Sem conta e sem backend: seu trabalho fica no seu navegador.

## Duas formas de finalizar

1. **Faça tudo você mesmo** — Posicione dispositivos, textos, formas e fundos, envie suas capturas reais e exporte. Você pode criar sozinho uma página promocional de app totalmente desenhada, sem IA.
2. **Deixe o design com uma IA** — Posicione espaços reservados de celular, dê nome a cada tela e gere um prompt com a especificação exata do layout (posições, cores, fontes). Cole no Claude Code, Cursor ou qualquer agente de código com IA para obter as imagens prontas.

## Recursos

- Várias páginas, cada uma editável separadamente
- Mockups de celular/tablet/relógio com modelos à escolha e um celular 3D inclinado
- Modelos divididos: um celular grande atravessando duas capturas
- Várias capturas em um mesmo celular, divididas em faixas diagonais com linha divisória
- Cor por letra, formas e fundos sólidos ou em degradê
- Exportação exata em PNG / ZIP nos tamanhos da App Store
- 17 idiomas, incluindo árabe (da direita para a esquerda)

## Primeiros passos

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # run Oxlint
```

## Tecnologias

React + TypeScript, Konva / react-konva para a tela, Zustand (+ Immer) para o estado, IndexedDB para o armazenamento local, Tailwind CSS e framer-motion. O editor não tem backend.

## Made with StoreReady (Referência)

A [página Reference](https://app-ready.store/reference) mostra apps reais cujas capturas foram feitas com o StoreReady. Adicionar seu app é um pull request que só acrescenta uma pasta, sem mexer em código:

1. Crie `src/reference/apps/<seu-app>/`.
2. Adicione `app.json` (`name` obrigatório; `tagline` e `link` opcionais), um `icon.svg` (ou png/webp) e suas capturas prontas em `screenshots/` (`1.png`, `2.png`, …).
3. Confira em `/reference` com `npm run dev` e abra o pull request.

Guia completo: [`src/reference/README.md`](src/reference/README.md). Envie apenas apps que sejam seus ou que você tenha permissão para mostrar.

## Contribuindo

Relatos de bugs e ideias são bem-vindos nas [GitHub Issues](https://github.com/jongeuni/StoreReady/issues). Pull requests também; para algo além de uma correção pequena, abra antes uma issue para alinharmos a abordagem.

## Patrocinadores

O StoreReady é gratuito. Apoiadores no Buy Me a Coffee aparecem no fim da página Reference, e o patrocínio pode incluir um espaço de app em destaque na página principal (veja abaixo).

### Configuração (para quem faz o deploy)

A lista de patrocinadores é lida do Buy Me a Coffee por uma pequena função serverless, `api/sponsors.js` (estilo Vercel). Defina a variável de ambiente `BMC_ACCESS_TOKEN` na sua hospedagem; sem ela a lista fica vazia. Defina `SPONSOR_URL` em `src/config.ts` para mostrar o botão “Torne-se patrocinador”.

## Colaboração e contato

Quer seu app na página principal ou tem uma ideia de parceria, patrocínio ou publicidade? Escreva para **hello@app-ready.store**. Para bugs e pedidos de recursos, use as GitHub Issues.
