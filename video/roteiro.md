# Vídeo: como funciona a Agência TI

Vídeo para a TV da sala (1920×1080, 30 fps), feito em Remotion. Ele abre a aula em `/slide`, antes do jogo.

**Ideia central:** a turma vira uma agência de TI. O vídeo explica o pedido do cliente, o banco de cartões, a energia, o cadeado, os botões Ajudar e Pedir ajuda, os imprevistos e o ranking. Depois simula uma partida.

## Voz no ElevenLabs

- **Voz:** Amanndev (ID `VnO7flSpwktZAgGGSQ2V`), a mesma do vídeo do OSLINUX.
- **Modelo:** Eleven v4 (`eleven_v4`). Ele entende as marcações `[excited]` e `[laughs]`. Se gerar com o Eleven Multilingual v2, apague as marcações.
- **Ajustes sugeridos:** Stability 45–50 %, Similarity 75 %, Style 20 %.
- **Pronúncia:** "TI" está escrito como se fala (tê-í). Na tela aparece "TI".
- **Tamanho:** cerca de 2.800 caracteres no total, em 11 falas.

## Onde salvar cada áudio

Salve em **`video/public/voice/`**, com exatamente o nome da tabela, em `.mp3`.

| Arquivo | Cena | Texto da narração |
|---|---|---|
| `s1.mp3` | Abertura | [excited] Fala, turma! Bem-vindos à Agência tê-í! Hoje, cada equipe vira uma agência de tecnologia. Os clientes chegam com pedidos, e a missão é planejar, dividir o trabalho e entregar tudo no prazo. |
| `s2.mp3` | Entrar e montar as equipes | Para começar, abra o site, digite o código da sala que aparece no telão e o seu nome. A tela fica cheia, e o professor monta as equipes. Sentou perto da sua equipe? Ótimo: vocês vão conversar muito. |
| `s3.mp3` | O pedido do cliente | Cada rodada tem um cliente. Leia o pedido com atenção! A Dona Rosa, por exemplo, quer o computador do caixa funcionando, Wi-Fi com senha, antivírus e uma planilha de estoque. |
| `s4.mp3` | Planejamento e pegadinhas | Primeiro vem o planejamento. Na lateral fica o banco de cartões. A equipe leva para A fazer só o que o cliente pediu: é só arrastar o cartão, ou clicar nele e depois na coluna. Mas cuidado com as pegadinhas! Instalar um jogo no computador do caixa? [laughs] A Dona Rosa não pediu isso. Cartão fora do pedido tira cinco pontos. |
| `s5.mp3` | Energia e cartões | Agora, a energia. Todo dia, a equipe recebe raios de energia, divididos entre todo mundo. Cada cartão custa um, dois ou três raios. Você clica em Pegar, ou arrasta o cartão, e ele vai para Fazendo. Cada clique em Gastar energia enche a barra. Barra cheia? O cartão vai para Pronto! |
| `s6.mp3` | Um cartão por vez e cadeado | Duas regras de ouro. Cada pessoa trabalha em um cartão por vez. E cartão com cadeado espera: não dá para testar a internet antes de conectar o Wi-Fi. Quando o cartão de antes fica pronto, o cadeado abre sozinho. |
| `s7.mp3` | Trabalho em equipe | Terminou o seu cartão, ou ele está esperando o cadeado? Não fique parado! Clique em Ajudar para gastar a sua energia no cartão de um colega. Travou em alguma coisa? Use o Pedir ajuda, e o seu cartão pisca na tela da equipe. E se a energia acabar, ajude com ideias: equipe que conversa termina primeiro. |
| `s8.mp3` | Imprevistos | [excited] E fiquem ligados: imprevistos acontecem! Alguém falta, a peça atrasa, o computador trava, falta energia... ou o cliente liga pedindo mais uma coisa. Às vezes a notícia é boa: o cliente traz café, e todo mundo ganha energia. Quando o alerta aparecer, replanejem juntos. |
| `s9.mp3` | Partida simulada | Bora ver uma partida? Valendo! A equipe Pixel leva os cartões certos para A fazer. A Ana pega o roteador e gasta um raio: pronto! O cadeado da senha abre. Imprevisto: o Bruno faltou hoje! A Carla clica em Ajudar e termina o cartão dele. No dia três, o último cartão fica pronto... [excited] pedido entregue! |
| `s10.mp3` | Pontos e ranking | Cada cartão pronto vale dez pontos. Entregou tudo no prazo? Mais vinte. A energia que sobrar vira bônus, e cartão fora do pedido tira pontos. No fim da rodada, o telão revela o ranking, uma equipe por vez, até a campeã! |
| `s11.mp3` | Encerramento | Resumindo: leiam o pedido, planejem, dividam o trabalho e conversem. É assim que uma equipe de tê-í de verdade trabalha. [excited] Preparados? Então... a Agência tê-í está aberta! |

## Depois de salvar os áudios

Dentro da pasta `video/`:

```bash
npm run voice
```

```bash
npm run render
```

O `npm run voice` mede cada áudio e ajusta o tempo das cenas sozinho. Se existir `ELEVENLABS_API_KEY` no `.env.local` da raiz do projeto, ele também transcreve as falas para as animações caírem exatamente na palavra; sem a chave, ele distribui as marcas pelo tamanho do texto. O vídeo sai em `public/video/agencia-ti.mp4`, que é o primeiro slide de `/slide`.

Sem áudio, o vídeo ainda funciona: cada cena dura o tempo estimado da fala.

## Sons

Clique do mouse, whoosh, ding e switch: biblioteca de sons do Remotion (remotion.media), os mesmos do CYBER WAR. Ficam em `video/public/sfx/`.
