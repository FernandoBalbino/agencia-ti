import { AbsoluteFill, Easing } from 'remotion';
import { Bg, Burst, C, CARD_H, CARD_W, Camera, Card, Chip, Cursor, FONT, Icon, Sfx, ease, lerp, useCue } from '../kit';
import type { Key } from '../kit';
import { BANK, MEMBERS } from './Plan';
import { Bank, Columns, Header, ROSA, Sidebar, slot } from './board';

const btnAt = (x: number, y: number) => ({ x: x + CARD_W - 78, y: y + CARD_H - 38 });

// s5 — energia: pegar o cartão, gastar raios, barra cheia vai para Pronto
export function S5() {
  const { frame, fps, at, p, pop, after } = useCue();
  const take = at('take', 0.2), s1 = at('spend', 0.1), s2 = at('full', -0.1), fin = at('done', -0.1);
  const mv1 = ease(frame, [take, take + 0.5 * fps], [0, 1]), mv2 = ease(frame, [fin, fin + 0.55 * fps], [0, 1]);
  const spent = (frame >= s1 ? 1 : 0) + (frame >= s2 ? 1 : 0);
  const a = slot(0, 1), b = slot(1, 0), c = slot(2, 0);
  const pos = mv2 > 0 ? { x: lerp(mv2, b.x, c.x), y: lerp(mv2, b.y, c.y) } : { x: lerp(mv1, a.x, b.x), y: lerp(mv1, a.y, b.y) };
  const state = mv2 >= 1 ? 'done' : mv1 > 0 ? 'doing' : 'todo';
  const press = (t: number) => (frame >= t && frame < t + 6 ? 1 : 0);
  const camera: Key[] = [
    [0, 960, 540, 1], [at('bolts', -0.3), 1730, 110, 2.1], [at('cost', -0.4), 1730, 110, 2.1], [at('cost', 0.2), 700, 620, 1.55],
    [take - 8, 760, 560, 1.2], [at('done', 1.2), 960, 560, 1],
  ];
  const pg = btnAt(a.x, a.y), gb = btnAt(b.x, b.y);
  const cursor: Key[] = [[take - 20, 900, 900, 1], [take - 6, pg.x, pg.y, 1], [s1 - 12, gb.x - 40, gb.y, 1], [s2 + 10, gb.x - 40, gb.y, 1], [fin + 0.6 * fps, 1300, 900, 1]];
  const others = [0, 2, 3].map((i) => BANK[i]);
  return (
    <AbsoluteFill>
      <Bg />
      <Camera keys={camera}>
        <Sidebar members={MEMBERS.map((m, i) => ({ ...m, e: i === 0 ? 2 - spent : 2, max: 2 }))} bankCount={2} />
        <Bank rows={BANK.slice(4)} />
        <Header {...ROSA} phase="Dia 1 de 3" time={`2:${String(59 - Math.floor(frame / fps) % 60).padStart(2, '0')}`} energy={[2 - spent, 2]} done={mv2 >= 1 ? 1 : 0} total={9}
          tip={state === 'todo' ? 'Pegue um cartão liberado em A fazer.' : 'Gaste energia no seu cartão. Ele fica pronto quando a barra enche.'} />
        <Columns counts={[3, state === 'doing' ? 1 : 0, state === 'done' ? 1 : 0]} />
        {others.map((o, k) => {
          const from = slot(0, k === 0 ? 0 : k + 1), to = slot(0, k === 0 ? 0 : k);
          const s = { x: from.x, y: lerp(mv1, from.y, to.y) }; // sobem quando o cartão sai de A fazer
          return <Card key={o.t} t={o.t} d={o.d} a={o.a} cost={o.c} state={k === 2 ? 'locked' : 'todo'} dep="Testar a internet" btn="Pegar" style={{ left: s.x, top: s.y }} />;
        })}
        <Card t={BANK[1].t} d={BANK[1].d} a="hw" cost={2} spent={spent} owner={state !== 'todo' ? 'Ana' : undefined} state={state} mine={state === 'doing'}
          btn={state === 'todo' ? 'Pegar' : 'Gastar energia'} primary={state === 'doing'} press={press(take) + press(s1) + press(s2)} glow={after('full') && state === 'doing' ? 1 : 0}
          style={{ left: pos.x, top: pos.y, zIndex: 20, scale: mv1 > 0 && mv1 < 1 ? 1.04 : 1 }} />
        {after('cost') && !after('take', -0.4) && (
          <div style={{ position: 'absolute', left: a.x + 30, top: a.y + CARD_H + 6, zIndex: 25, scale: ease(pop('cost'), [0, 1], [0.5, 1], Easing.back(1.6)) }}>
            <Chip size={26} bg={C.amber2} fg="#2b1d00"><Icon n="zap" size={24} fill="#2b1d00" />este custa 2 raios</Chip>
          </div>
        )}
        {after('bolts') && !after('cost', 0.1) && (
          <div style={{ position: 'absolute', left: 1600, top: 160, zIndex: 25, scale: ease(pop('bolts'), [0, 1], [0.5, 1], Easing.back(1.6)), font: `700 22px ${FONT}` }}>
            <Chip size={22} bg={C.ink} fg="#fff">2 raios para você hoje</Chip>
          </div>
        )}
        <Burst p={p('done', 0.8, 0.4)} color={C.green} x={c.x + CARD_W / 2} y={c.y + CARD_H / 2} />
        <Cursor path={cursor} clicks={[take, s1, s2]} />
      </Camera>
      <Sfx at={s1} src="switch" volume={0.5} />
      <Sfx at={s2} src="switch" volume={0.5} />
      <Sfx at={fin + 0.5 * fps} src="ding" volume={0.6} />
    </AbsoluteFill>
  );
}
