import { AbsoluteFill } from 'remotion';
import { Bg, C, CARD_W, Camera, Card, Cursor, Points, Sfx, ease, lerp, useCue } from '../kit';
import type { Area, Key } from '../kit';
import { BANKW, BANKX, Bank, Columns, Header, ROSA, Sidebar, bankY, slot } from './board';

export const BANK: { t: string; c: number; a: Area; d: string }[] = [
  { t: 'Ligar o roteador Wi-Fi', c: 1, a: 'rede', d: 'Ligar na tomada e no cabo da internet.' },
  { t: 'Ligar e testar o computador do caixa', c: 2, a: 'hw', d: 'Conferir os cabos e ver se o Windows inicia.' },
  { t: 'Criar a planilha de estoque', c: 3, a: 'app', d: 'Colunas de produto, quantidade e preço.' },
  { t: 'Instalar o antivírus', c: 2, a: 'seg', d: 'Baixar, instalar e atualizar.' },
  { t: 'Instalar um jogo no PC do caixa', c: 2, a: 'app', d: 'Para passar o tempo no balcão.' },
  { t: 'Trocar a placa de vídeo', c: 3, a: 'hw', d: 'Uma placa nova e mais potente.' },
];
export const MEMBERS = [{ name: 'Ana' }, { name: 'Bruno' }, { name: 'Carla' }, { name: 'Davi' }];
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// s4 — planejamento: levar para "A fazer" só o que o cliente pediu (+, arrastar, ou clicar e escolher a coluna)
export function S4() {
  const { frame, fps, at, p, after } = useCue();
  const A = at('todo', 0.4), B = at('drag', 0.1), Csel = at('clickcol', 0.1), Cdrop = Csel + 0.9 * fps;
  const flights = [
    { row: 0, start: A, len: 0.5 },
    { row: 1, start: B, len: 0.9 },
    { row: 2, start: Cdrop, len: 0.5 },
  ];
  const fp = (k: number) => ease(frame, [flights[k].start, flights[k].start + flights[k].len * fps], [0, 1]);
  const selected = frame >= Csel && frame < Cdrop;
  const plusX = BANKX + BANKW - 26, rowY = (i: number) => bankY(i) + 29;
  const target = (k: number) => slot(0, k);
  const dragPos = { x: lerp(fp(1), BANKX + 160, target(1).x + CARD_W / 2), y: lerp(fp(1), rowY(1), target(1).y + 90) };
  const trap = after('trap') ? ease(frame, [at('trap'), at('trap', 0.3)], [0, 1]) : 0;

  const cursor: Key[] = [
    [A - 18, 700, 700, 1], [A - 4, plusX, rowY(0), 1],
    [B - 10, BANKX + 160, rowY(1), 1], [B, BANKX + 160, rowY(1), 1], [B + 0.9 * fps, dragPos.x, target(1).y + 90, 1],
    [Csel - 10, BANKX + 150, rowY(2), 1], [Cdrop - 12, 640, 340, 1],
    [at('game', -0.3), BANKX + 200, rowY(4), 1], [at('minus', 0.6), 700, 700, 1],
  ];
  const camera: Key[] = [
    [0, 960, 540, 1], [at('bank', -0.2), 560, 650, 1.32], [Cdrop + 0.6 * fps, 560, 650, 1.32], [at('trap', -0.2), 640, 620, 1],
    [at('game', -0.2), 420, 760, 1.45], [at('minus', 0.9), 420, 760, 1.45], [at('minus', 1.5), 960, 540, 1],
  ];
  const rows = BANK.map((b, i) => ({ ...b, gone: flights.some((f, k) => f.row === i && fp(k) > 0) ? 1 : 0, sel: i === 2 && selected ? 1 : 0, hi: i === 4 ? trap : 0, stamp: i === 4 ? p('no', 0.4) : 0 }));
  const onBoard = flights.filter((_, k) => fp(k) > 0).length;

  return (
    <AbsoluteFill>
      <Bg />
      <Camera keys={camera}>
        <Sidebar members={MEMBERS} bankCount={BANK.length - onBoard} />
        <Bank rows={rows} />
        <Header {...ROSA} phase="Planejamento" time={clock(120 - frame / fps)} done={0} total={9}
          tip={selected ? 'Agora clique na coluna para onde quer levar “Criar a planilha de estoque”' : 'Planejamento: leiam o pedido e levem para A fazer só o que o cliente pediu.'}
          tipColor={selected ? C.blue : C.violet} />
        <Columns counts={[onBoard, 0, 0]} armed={selected ? [0] : []} />
        {flights.map((f, k) => {
          const m = fp(k);
          if (m <= 0) return null;
          const b = BANK[f.row], to = target(k);
          const from = k === 1 ? { x: dragPos.x - CARD_W / 2, y: dragPos.y - 90 } : { x: BANKX, y: bankY(f.row) };
          const x = k === 1 ? from.x : lerp(m, from.x, to.x), y = k === 1 ? from.y : lerp(m, from.y, to.y);
          return <Card key={b.t} t={b.t} d={b.d} a={b.a} cost={b.c} note="Liberado para o dia 1" style={{ left: x, top: y, scale: lerp(m, 0.78, 1), zIndex: m < 1 ? 30 : 2, rotate: k === 1 && m < 1 ? '3deg' : undefined }} />;
        })}
        <Points p={p('minus', 1.2)} text="−5 pontos" color={C.red} x={BANKX + 190} y={rowY(4) - 30} size={58} />
        <Cursor path={cursor} clicks={[A - 4, B, Csel - 10 + 10, Cdrop - 12 + 8]} />
      </Camera>
      <Sfx at={at('no')} src="switch" volume={0.5} />
      {flights.map((f, k) => <Sfx key={k} at={f.start + f.len * fps} src="ding" volume={0.25} />)}
    </AbsoluteFill>
  );
}
