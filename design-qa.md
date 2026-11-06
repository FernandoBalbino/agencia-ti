# Design QA

Conferido com `tests/e2e.mjs` em 1366×768 (Chromebook em tela cheia), com 2 alunos no navegador e 11 robôs. Prints em `docs/prints`.

- [x] Entrada do aluno com código e nome; pedido de tela cheia no clique de entrar e tela de bloqueio se sair dela.
- [x] Professor monta equipes à mão: clicar em um ou mais alunos e depois na equipe, ou arrastar. Sorteio equilibrado (diferença máxima de 1). Quem fica sem equipe vai para as menores ao começar.
- [x] O aluno vê a própria equipe assim que o professor coloca (para sentar junto).
- [x] Planejamento: banco de cartões na lateral, cartões vão para "A fazer" e voltam ao banco.
- [x] Dia: pegar cartão, gastar energia, ajudar colega, cadeado, peça atrasada, pedido de ajuda.
- [x] Vinheta de imprevisto no telão e na tela da equipe; vinheta verde de pedido entregue.
- [x] Telão: relógio grande, corrida das equipes, pedido do cliente e últimos acontecimentos; controles no rodapé.
- [x] Resultado: revela da última para a primeira, pódio com confete, tabela com total acumulado e resumo de cada equipe na missão.
- [x] Aluno vê "Olhe o telão!" durante a revelação e depois o resumo da própria equipe.
- [x] Nenhum erro no console durante a partida completa.
- [x] `prefers-reduced-motion`: animações reduzidas; a vinheta vira um aviso que aparece e some.
- [x] Aluno move cartões de três jeitos: botão (+ / Pegar), arrastar, ou clicar no cartão e depois na coluna (as colunas de destino ficam tracejadas e aparece a instrução).
- [x] Vídeo (Remotion, 1920×1080, 3 min 7 s): quadros conferidos em abertura, entrada, pedido, planejamento, energia, regras, equipe, imprevistos, partida, ranking e encerramento; vinhetas legíveis; narração sincronizada (cenas 1–6 por transcrição, 7–11 pelo tamanho do texto, erro médio de 0,27 s).

