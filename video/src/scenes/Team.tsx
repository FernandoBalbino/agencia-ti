import { AbsoluteFill, Easing } from 'remotion';
import { Bg, C, CARD_H, CARD_W, Card, Cursor, FONT, Face, Icon, Points, Sfx, Title, Toast, ease, useCue } from '../kit';
import type { Key } from '../kit';

const X = [150, 740, 1330];

// s7 — ajudar um colega, pedir ajuda e conversar
export function S7() {
  const { frame, fps, at, p, pop, after } = useCue();
  const helpAt = at('help', 0.5), askAt = at('ask', 0.3);
  const helped = frame >= helpAt;
  const asked = frame >= askAt;
  const blink = asked ? 0.6 + 0.4 * Math.abs(Math.sin((frame - askAt) / 7)) : 1;
  const cursor: Key[] = [
    [helpAt - 26, 900, 950, 1], [helpAt - 6, X[1] + CARD_W - 80, 300 + CARD_H - 38, 1],
    [askAt - 24, 1500, 640, 1], [askAt - 6, 1595, 642, 1], [at('idea'), 1700, 980, 1],
  ];
  const lines: [string, string][] = [['Ana', 'Eu ajudo no antivírus!'], ['Bruno', 'Falta só a planilha'], ['Carla', 'Amanhã eu faço o cartaz'], ['Davi', 'Bora, equipe!']];
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Bg />
      <Title size={64} style={{ position: 'absolute', top: 80, width: '100%', opacity: p('empty', 0.5) }}>Ninguém fica parado</Title>
      <div style={{ position: 'absolute', left: X[0], top: 230, font: `600 26px ${FONT}`, color: C.ink2, opacity: p('empty', 0.5) }}>Seu cartão está pronto</div>
      <Card t="Ligar o roteador Wi-Fi" d="Ligar na tomada e no cabo da internet." a="rede" cost={1} spent={1} owner="Ana" state="done" style={{ left: X[0], top: 300, opacity: p('empty', 0.5) }} />
      <div style={{ position: 'absolute', left: X[1], top: 230, font: `600 26px ${FONT}`, color: C.ink2, opacity: p('help', 0.4, -0.4) }}>Cartão da Carla</div>
      <Card t="Criar a planilha de estoque" d="Colunas de produto, quantidade e preço." a="app" cost={3} spent={helped ? 2 : 1} owner="Carla" state="doing" btn="Ajudar"
        press={frame >= helpAt && frame < helpAt + 6 ? 1 : 0} glow={helped && frame < helpAt + fps ? 1 : 0} style={{ left: X[1], top: 300, opacity: p('help', 0.4, -0.4) }} />
      <Points p={ease(frame, [helpAt, helpAt + 1.2 * fps], [0, 1])} text="+1 ⚡ da Ana" color={C.amber} x={X[1] + CARD_W / 2} y={280} size={46} />
      <div style={{ position: 'absolute', left: X[2], top: 230, font: `600 26px ${FONT}`, color: C.ink2, opacity: p('stuck', 0.4) }}>Cartão do Davi</div>
      <div style={{ opacity: p('stuck', 0.4) }}>
        <Card t="Instalar o antivírus" d="Baixar, instalar e atualizar." a="seg" cost={2} spent={0} owner="Davi" state="doing" mine help={asked ? 'Davi pediu ajuda' : undefined}
          btn="Gastar energia" primary style={{ left: X[2], top: 300, opacity: blink }} />
      </div>
      {after('stuck') && (
        <div style={{ position: 'absolute', left: 1500, top: 610, display: 'flex', alignItems: 'center', gap: 10, height: 64, padding: '0 24px', borderRadius: 16, background: asked ? C.amberSoft : C.blue, color: asked ? C.amber : '#fff', font: `700 26px ${FONT}`, scale: ease(pop('stuck'), [0, 1], [0.6, 1], Easing.back(1.6)) }}>
          <Icon n="hand" size={28} />{asked ? 'Ajuda pedida' : 'Pedir ajuda'}
        </div>
      )}
      <Toast at={at('blink')} text="Davi pediu ajuda em “Instalar o antivírus”" len={2.6} bg={C.amber2} fg="#2b1d00" />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 790, display: 'flex', justifyContent: 'center', gap: 60 }}>
        {lines.map(([n, t], i) => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: p('idea', 0.4, i * 0.12) }}>
            <div style={{ padding: '14px 22px', borderRadius: '22px 22px 22px 6px', background: C.surface, border: `2px solid ${C.line}`, font: `600 24px ${FONT}`, scale: ease(pop('talk', i * 0.15), [0, 1], [0.4, 1]), opacity: ease(pop('talk', i * 0.15), [0, 0.3], [0, 1]), whiteSpace: 'nowrap' }}>{t}</div>
            <Face name={n} size={74} />
            <span style={{ font: `600 24px ${FONT}` }}>{n}</span>
          </div>
        ))}
      </div>
      <Cursor path={cursor} clicks={[helpAt, askAt]} />
      <Sfx at={helpAt} src="switch" volume={0.5} />
      <Sfx at={at('blink')} src="ding" volume={0.35} />
    </AbsoluteFill>
  );
}
