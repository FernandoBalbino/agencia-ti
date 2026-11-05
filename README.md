# Agência TI

Jogo em equipe, em tempo real, para aprender **gerenciamento de projetos** (Informática Aplicada: organizar tarefas e prazos e trabalhar em equipe com ferramentas online).

Cada equipe vira uma agência de TI e recebe o pedido de um cliente (a papelaria da Dona Rosa, o notebook do Seu João, o salão da Kelly…). A equipe escolhe no banco os cartões que o cliente pediu, divide o trabalho num quadro Kanban e gasta a energia do dia para entregar tudo no prazo, enquanto aparecem imprevistos.

- **Jogo:** https://fernandobalbino.github.io/agencia-ti/
- **Professor:** https://fernandobalbino.github.io/agencia-ti/#prof
- **Aula com vídeo e slides:** https://fernandobalbino.github.io/agencia-ti/slide/

## Como funciona a rodada

1. O professor cria a sala e projeta a tela dele na TV. Os alunos entram com o código e o nome, em tela cheia.
2. O professor escolhe quantas equipes, dias, minutos por dia, tempo de planejamento e energia, e sorteia as equipes (tamanhos iguais, com diferença de no máximo 1 aluno).
3. **Planejamento:** a equipe lê o pedido e leva para *A fazer* só os cartões pedidos. Cartão fora do pedido tira 5 pontos.
4. **Dias:** cada aluno recebe raios de energia. Pega um cartão (um por vez), gasta energia nele e, quando a barra enche, o cartão vai para *Pronto*. Cartão com cadeado espera outro ficar pronto. Dá para **ajudar** o cartão de um colega e **pedir ajuda**.
5. **Imprevistos:** integrante faltou, queda de energia, peça atrasada, computador travou, pedido extra ou café do cliente (+1 ⚡). Saem sozinhos a partir do dia 2 (iguais para todas as equipes) ou quando o professor solta.
6. **Resultado:** quando todas as equipes entregam ou o tempo acaba, o telão revela o ranking uma equipe por vez, mostra o pódio e o resumo de cada equipe na missão.

Pontos: +10 por cartão do pedido pronto, +20 se entregar tudo no prazo, +2 por raio que sobrar, −5 por cartão fora do pedido.

## Rodar no computador

Requer Node.js 24.

```bash
npm install
```

```bash
npm run server
```

```bash
npm run dev
```

Abra `http://localhost:5173/#prof` para o professor e `http://localhost:5173/` para os alunos.

## Testes (tudo local, sem gastar o Render)

```bash
npm test
```

Partida completa com prints em `docs/prints` (servidor acelerado + site rodando):

```bash
AG_SPEED=12 node server/index.ts
```

```bash
PW_CHANNEL=msedge node tests/e2e.mjs http://localhost:5173/
```

Alunos-robô numa sala aberta: `node tests/bots.mjs CODIGO 12`.

## Publicação

- **Site (GitHub Pages):** `.github/workflows/pages.yml` testa, compila e publica a cada envio para a `main`. A variável `SERVER_URL` do repositório aponta para o servidor.
- **Servidor (Render, plano gratuito):** `render.yaml`. Só redeploya quando muda `server/`, `shared/` ou o `package.json`. O servidor gratuito dorme sem uso e leva até 1 minuto para acordar: abrir a aula (`/slide`) já acorda ele.
- **Vídeo:** projeto Remotion em `video/`. O MP4 fica em `public/video/`.
