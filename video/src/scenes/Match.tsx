import { AbsoluteFill, Easing } from 'remotion';
import { Bg, C, CARD_H, CARD_W, Camera, Card, Confetti, Cursor, FONT, Sfx, Vignette, ease, lerp, useCue } from '../kit';
import type { Area, Key } from '../kit';
import { Bank, Columns, Header, ROSA, Sidebar, bankY, slot } from './board';

type C3 = { t: string; d: string; a: Area; c: number };
const A: C3 = { t: 'Ligar o roteador Wi-Fi', d: 'Ligar na tomada e no cabo da internet.', a: 'rede', c: 1 };
const S: C3 = { t: 'Trocar a senha do Wi-Fi', d: 'Senha forte no lugar da de fábrica.', a: 'rede', c: 2 };
const P: C3 = { t: 'Criar a planilha de estoque', d: 'Colunas de produto, quantidade e preço.', a: 'app', c: 3 };
const B: C3 = { t: 'Criar a conta da Dona Rosa', d: 'Usuário com o nome dela e senha.', a: 'so', c: 1 };
const L: C3 = { t: 'Ensinar a Dona Rosa a salvar a planilha', d: 'Mostrar onde fica o arquivo.', a: 'atend', c: 2 };
const btn = (s: { x: number; y: number }) => ({ x: s.x + CARD_W - 80, y: s.y + CARD_H - 38 });

// s9 — uma partida simulada da equipe Pixel
export function S9() {
  const { frame, fps, at, after } = useCue();
  const g = (t0: number, len = 0.45) => ease(frame, [t0, t0 + len * fps], [0, 1]);
  const mv = (a: { x: number; y: number }, b: { x: number; y: number }, t0: number, len = 0.45) => { const k = g(t0, len); return { x: lerp(k, a.x, b.x), y: lerp(k, a.y, b.y) }; };
  const fly = [0, 1, 2].map((i) => g(at('cards') + i * 5, 0.5));
  const take = at('ana', 0.3), spend = at('spend', 0.1), helpAt = at('carla', 0.4), day3 = at('day3'), last = at('last', 0.2);
  const late = after('day3', 0.2);
  // posições antes do dia 3
  const posA = frame < spend + 8 ? mv(slot(0, 0), slot(1, 0), take) : mv(slot(1, 0), slot(2, 0), spend + 8);
  const posS = mv(slot(0, 1), slot(0, 0), take), posP = mv(slot(0, 2), slot(0, 1), take);
  const posB = frame < helpAt + 8 ? mv(slot(1, 0), slot(1, 1), take) : mv(slot(1, 1), slot(2, 1), helpAt + 8);
  const aDone = frame >= spend, bDone = frame >= helpAt, opened = after('unlock');
  const bruno = after('bruno');
  const lastDone = frame >= last;
  const posL = lastDone ? mv(slot(1, 0), slot(2, 0), last + 8) : slot(1, 0);
  const members = [
    { name: 'Ana', e: late ? (lastDone ? 1 : 2) : aDone ? 1 : 2, max: 2 },
    { name: 'Bruno', e: 0, max: 2, tag: bruno && !late ? ('faltou' as const) : undefined },
    { name: 'Carla', e: late ? 2 : bDone ? 1 : 2, max: 2 },
    { name: 'Davi', e: 2, max: 2 },
  ];
  const done = late ? (lastDone ? 9 : 8) : (aDone ? 1 : 0) + (bDone ? 1 : 0);
  const secs = late ? 179 - (frame - day3) / fps : 179 - (frame - at('go')) / fps;
  const camera: Key[] = late ? [[day3, 960, 560, 1], [last - 10, 1150, 560, 1.2], [at('delivered'), 960, 540, 1]]
    : [[0, 960, 540, 1], [take - 10, 860, 560, 1.18], [at('unlock', 0.8), 860, 560, 1.18], [at('bruno', -0.2), 960, 540, 1], [helpAt - 14, 1050, 640, 1.18], [day3, 960, 540, 1]];
  const cursor: Key[] = late ? [[day3 + 10, 1500, 900, 1], [last - 6, btn(slot(1, 0)).x, btn(slot(1, 0)).y, 1], [at('delivered'), 1500, 950, 1]]
    : [[take - 24, 900, 960, 1], [take - 5, btn(slot(0, 0)).x, btn(slot(0, 0)).y, 1], [spend - 8, btn(slot(1, 0)).x - 40, btn(slot(1, 0)).y, 1], [helpAt - 24, 1300, 950, 1], [helpAt - 5, btn(slot(1, 1)).x, btn(slot(1, 1)).y, 1], [day3, 1300, 950, 1]];
  const clicks = late ? [last] : [take, spend, helpAt];
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Bg />
      <Camera keys={camera}>
        <Sidebar members={members} bankCount={late ? 3 : 6 - fly.filter((f) => f > 0).length} />
        {!late && <Bank rows={[{ t: 'Instalar um jogo no PC do caixa', c: 2, a: 'app' as Area, gone: 0 }, { t: 'Trocar a placa de vídeo', c: 3, a: 'hw' as Area, gone: 0 }, { t: 'Pôr papel de parede do time', c: 1, a: 'so' as Area, gone: 0 }].concat([A, S, P].map((r, i) => ({ t: r.t, c: r.c, a: r.a, gone: fly[i] > 0 ? 1 : 0 })))} />}
        {late && <Bank rows={[{ t: 'Instalar um jogo no PC do caixa', c: 2, a: 'app' }, { t: 'Trocar a placa de vídeo', c: 3, a: 'hw' }, { t: 'Pôr papel de parede do time', c: 1, a: 'so' }]} />}
        <Header {...ROSA} phase={late ? 'Dia 3 de 3' : 'Dia 1 de 3'} time={`${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`} energy={[members[0].e, 2]} done={done} total={9}
          tip={bruno && !bDone ? 'Bruno faltou hoje: a equipe cobre o cartão dele.' : 'Gaste energia no seu cartão. Ele fica pronto quando a barra enche.'} />
        {!late ? (
          <>
            <Columns counts={[aDone || frame >= take ? 2 : fly.filter((f) => f > 0).length, (frame >= take && !aDone ? 1 : 0) + (bDone ? 0 : 1), (aDone ? 1 : 0) + (bDone ? 1 : 0)]} />
            {[A, S, P].map((c, i) => {
              if (fly[i] <= 0) return null;
              const from = { x: 24, y: bankY(i + 3) }, to = slot(0, i);
              const flying = fly[i] < 1;
              const pos = flying ? { x: lerp(fly[i], from.x, to.x), y: lerp(fly[i], from.y, to.y) } : i === 0 ? posA : i === 1 ? posS : posP;
              const isA = i === 0, st = isA ? (aDone ? 'done' : frame >= take ? 'doing' : 'todo') : i === 1 && !opened ? 'locked' : 'todo';
              return <Card key={c.t} t={c.t} d={c.d} a={c.a} cost={c.c} spent={isA && aDone ? 1 : 0} owner={isA && frame >= take ? 'Ana' : undefined} state={st} mine={isA && st === 'doing'}
                dep="Ligar o roteador Wi-Fi" btn={isA && st === 'doing' ? 'Gastar energia' : 'Pegar'} primary={isA && st === 'doing'}
                style={{ left: pos.x, top: pos.y, scale: flying ? lerp(fly[i], 0.78, 1) : i === 1 && opened ? ease(frame, [at('unlock'), at('unlock', 0.3)], [1.06, 1], Easing.back(2)) : 1, zIndex: flying || (isA && frame < spend + 30) ? 20 : 2 }} />;
            })}
            <Card t={B.t} d={B.d} a={B.a} cost={1} spent={bDone ? 1 : 0} owner="Bruno" state={bDone ? 'done' : 'doing'} help={bruno && !bDone ? 'Bruno faltou hoje' : undefined} btn="Ajudar"
              style={{ left: posB.x, top: posB.y, zIndex: 10 }} />
          </>
        ) : (
          <>
            <Columns counts={[0, lastDone ? 0 : 1, lastDone ? 9 : 8]} />
            {[S, A, P].map((c, i) => <Card key={c.t} t={c.t} d={c.d} a={c.a} cost={c.c} spent={c.c} owner={['Davi', 'Ana', 'Carla'][i]} state="done" style={{ left: slot(2, i).x, top: slot(2, i).y + (lastDone ? ease(frame, [last + 8, last + 22], [0, CARD_H + 16]) : 0) }} />)}
            <Card t={L.t} d={L.d} a={L.a} cost={2} spent={lastDone ? 2 : 1} owner="Ana" state={lastDone ? 'done' : 'doing'} mine={!lastDone} btn="Gastar energia" primary style={{ left: posL.x, top: posL.y, zIndex: 20 }} />
          </>
        )}
        <Cursor path={cursor} clicks={clicks} />
      </Camera>
      {frame >= day3 - 4 && frame < day3 + 1.3 * fps && (
        <AbsoluteFill style={{ display: 'grid', placeItems: 'center', background: 'rgba(243,245,249,.75)', opacity: ease(frame, [day3 - 4, day3 + 4, day3 + 1.1 * fps, day3 + 1.3 * fps], [0, 1, 1, 0]), zIndex: 85 }}>
          <div style={{ padding: '40px 80px', borderRadius: 40, background: C.surface, boxShadow: '0 30px 80px -30px rgba(20,26,46,.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', scale: ease(frame, [day3 - 4, day3 + 10], [1.3, 1]) }}>
            <span style={{ font: `700 26px ${FONT}`, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.ink3 }}>Dia</span>
            <span style={{ font: `800 170px/1 ${FONT}`, color: C.blue, letterSpacing: '-0.04em' }}>3<small style={{ fontSize: 64, color: C.ink3 }}>/3</small></span>
            <span style={{ font: `600 28px ${FONT}`, color: C.amber }}>Energia recarregada</span>
          </div>
        </AbsoluteFill>
      )}
      <Vignette at={at('bruno', -0.1)} kicker="imprevisto" name="Equipe Pixel" title="Integrante faltou" text="Bruno faltou hoje e ficou sem energia." icon="userx" len={1.4} />
      <Vignette at={at('delivered', -0.1)} kicker="pedido concluído" name="Equipe Pixel" title="Entregue" text="Pedido entregue no dia 3!" good icon="package" len={1.9} />
      <Confetti at={at('delivered', 0.3)} />
      <Sfx at={spend} src="switch" volume={0.5} /><Sfx at={spend + 12} src="ding" volume={0.5} />
      <Sfx at={at('unlock')} src="ding" volume={0.4} />
      <Sfx at={helpAt} src="switch" volume={0.5} /><Sfx at={helpAt + 12} src="ding" volume={0.5} />
      <Sfx at={day3} src="whoosh" volume={0.5} />
      <Sfx at={last} src="switch" volume={0.5} />
    </AbsoluteFill>
  );
}
