// Roteiro da narração (voz Amanndev, ElevenLabs v4). As marcas [excited], [laughs]... dão entonação.
// `cues`: nome -> trecho do texto; o tempo em que cada trecho é falado sincroniza as animações.
// "a|b" aceita qualquer das formas (a transcrição pode escrever "três" como "3").
export type Scene = { id: string; text: string; cues: Record<string, string> };

export const SCENES: Scene[] = [
  {
    id: 's1',
    text: '[excited] Fala, turma! Bem-vindos à Agência tê-í! Hoje, cada equipe vira uma agência de tecnologia. Os clientes chegam com pedidos, e a missão é planejar, dividir o trabalho e entregar tudo no prazo.',
    cues: { title: 'Agência', team: 'cada equipe', clients: 'clientes', plan: 'planejar', split: 'dividir', deadline: 'prazo' },
  },
  {
    id: 's2',
    text: 'Para começar, abra o site, digite o código da sala que aparece no telão e o seu nome. A tela fica cheia, e o professor monta as equipes. Sentou perto da sua equipe? Ótimo: vocês vão conversar muito.',
    cues: { code: 'código', name: 'seu nome', full: 'tela fica cheia', teams: 'monta', sit: 'Sentou', talk: 'conversar' },
  },
  {
    id: 's3',
    text: 'Cada rodada tem um cliente. Leia o pedido com atenção! A Dona Rosa, por exemplo, quer o computador do caixa funcionando, Wi-Fi com senha, antivírus e uma planilha de estoque.',
    cues: { client: 'Cada rodada', read: 'Leia', rosa: 'Dona Rosa', pc: 'computador', wifi: 'wi-fi|wifi', av: 'antivírus|antivirus', sheet: 'planilha' },
  },
  {
    id: 's4',
    text: 'Primeiro vem o planejamento. Na lateral fica o banco de cartões. A equipe leva para A fazer só o que o cliente pediu: é só arrastar o cartão, ou clicar nele e depois na coluna. Mas cuidado com as pegadinhas! Instalar um jogo no computador do caixa? [laughs] A Dona Rosa não pediu isso. Cartão fora do pedido tira cinco pontos.',
    cues: { plan: 'planejamento', bank: 'banco', todo: 'leva', drag: 'arrastar', clickcol: 'clicar nele', trap: 'pegadinhas', game: 'Instalar um jogo', no: 'não pediu', minus: 'cinco pontos|5 pontos' },
  },
  {
    id: 's5',
    text: 'Agora, a energia. Todo dia, a equipe recebe raios de energia, divididos entre todo mundo. Cada cartão custa um, dois ou três raios. Você clica em Pegar, ou arrasta o cartão, e ele vai para Fazendo. Cada clique em Gastar energia enche a barra. Barra cheia? O cartão vai para Pronto!',
    cues: { energy: 'energia', bolts: 'raios de energia', cost: 'custa', take: 'Pegar', drag: 'arrasta', doing: 'Fazendo', spend: 'Gastar', full: 'Barra cheia', done: 'Pronto' },
  },
  {
    id: 's6',
    text: 'Duas regras de ouro. Cada pessoa trabalha em um cartão por vez. E cartão com cadeado espera: não dá para testar a internet antes de conectar o Wi-Fi. Quando o cartão de antes fica pronto, o cadeado abre sozinho.',
    cues: { rules: 'regras', one: 'um cartão por vez', lock: 'cadeado', internet: 'testar a internet', wifi: 'conectar', open: 'abre sozinho' },
  },
  {
    id: 's7',
    text: 'Terminou o seu cartão, ou ele está esperando o cadeado? Não fique parado! Clique em Ajudar para gastar a sua energia no cartão de um colega. Travou em alguma coisa? Use o Pedir ajuda, e o seu cartão pisca na tela da equipe. E se a energia acabar, ajude com ideias: equipe que conversa termina primeiro.',
    cues: { empty: 'Terminou', help: 'Ajudar', mate: 'colega', stuck: 'Travou', ask: 'Pedir ajuda', blink: 'pisca', idea: 'ideias', talk: 'conversa' },
  },
  {
    id: 's8',
    text: '[excited] E fiquem ligados: imprevistos acontecem! Alguém falta, a peça atrasa, o computador trava, falta energia... ou o cliente liga pedindo mais uma coisa. Às vezes a notícia é boa: o cliente traz café, e todo mundo ganha energia. Quando o alerta aparecer, replanejem juntos.',
    cues: { imp: 'imprevistos', absent: 'Alguém falta', late: 'peça atrasa', crash: 'computador trava', power: 'falta energia', extra: 'liga pedindo', good: 'notícia é boa', coffee: 'café', replan: 'replanejem' },
  },
  {
    id: 's9',
    text: 'Bora ver uma partida? Valendo! A equipe Pixel leva os cartões certos para A fazer. A Ana pega o roteador e gasta um raio: pronto! O cadeado da senha abre. Imprevisto: o Bruno faltou hoje! A Carla clica em Ajudar e termina o cartão dele. No dia três, o último cartão fica pronto... [excited] pedido entregue!',
    cues: { go: 'Valendo', cards: 'cartões certos', ana: 'Ana', spend: 'gasta um raio', unlock: 'cadeado da senha', bruno: 'Bruno', carla: 'Carla', day3: 'dia três|dia 3', last: 'último', delivered: 'pedido entregue' },
  },
  {
    id: 's10',
    text: 'Cada cartão pronto vale dez pontos. Entregou tudo no prazo? Mais vinte. A energia que sobrar vira bônus, e cartão fora do pedido tira pontos. No fim da rodada, o telão revela o ranking, uma equipe por vez, até a campeã!',
    cues: { ten: 'dez pontos|10 pontos', twenty: 'vinte|20', bonus: 'bônus|bonus', minus: 'tira pontos', reveal: 'revela', one: 'uma equipe', champ: 'campeã|campea' },
  },
  {
    id: 's11',
    text: 'Resumindo: leiam o pedido, planejem, dividam o trabalho e conversem. É assim que uma equipe de tê-í de verdade trabalha. [excited] Preparados? Então... a Agência tê-í está aberta!',
    cues: { read: 'leiam', plan: 'planejem', split: 'dividam', talk: 'conversem', real: 'de verdade', ready: 'Preparados', open: 'aberta' },
  },
];
