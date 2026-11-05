# AGENTS.md

- Regras do jogo: `server/game.ts`. O servidor é a única fonte de verdade; o site só mostra e pede ações.
- Clientes e cartões: `shared/clients.ts`. Cartão com `x: true` é pegadinha (fora do pedido, −5). `bonus` entra pelo imprevisto "pedido extra".
- Regras puras (sorteio equilibrado, divisão da energia, cadeado, pontuação, nomes das equipes): `shared/rules.ts`.
- Aluno recebe só a própria equipe (`team`); professor recebe o resumo (`teams`, `players`). Pela rede passam só ids de cartão: os textos ficam no site.
- O Render tem limite de banda de 5 GB: teste tudo localmente (`npm test`, `npm run e2e`, `tests/bots.mjs`). No Render, só `/healthz`. Site, vídeo e slides ficam no GitHub Pages. Socket.IO só por WebSocket.
- `render.yaml` só redeploya quando muda `server/`, `shared/` ou o `package.json` (o site não gasta build do Render).
- Node 24 roda TypeScript direto (sem build no servidor): use só sintaxe apagável (sem enum, namespace ou parameter properties) e importe com `.ts`.
- `AG_SPEED=12` acelera o relógio do servidor para testes (1 minuto vira 5 s).
- Interface em português, textos curtos; animações só com `transform`/`opacity`, respeitando `prefers-reduced-motion`. Telas pensadas para Chromebook 1366×768 em tela cheia e para a TV.
- `/slide` (`src/Slides.tsx`) é a aula: vídeo + slides de gerenciamento de projetos. Não importa `net.ts`; só faz um `/healthz` para acordar o servidor enquanto o vídeo passa.
- Vídeo: projeto Remotion em `video/`. Animações só por `useCurrentFrame()`. Roteiro em `video/src/script.ts`; vozes em `video/public/voice/` geradas pelo conector da ElevenLabs (voz Amanndev, modelo eleven_v4). A chave da ElevenLabs, se precisar, fica só em `.env.local` (fora do Git).
