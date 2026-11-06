import { AbsoluteFill, Easing } from 'remotion';
import { Bg, C, CARD_H, CARD_W, Card, Cursor, FONT, Icon, Sfx, Title, Toast, ease, useCue } from '../kit';
import type { Key } from '../kit';

function Box({ n, title, x, p }: { n: number; title: string; x: number; p: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: 250, width: 760, height: 760, borderRadius: 32, background: 'rgba(255,255,255,.7)', border: `2px solid ${C.line}`, opacity: p, translate: `0 ${ease(p, [0, 1], [40, 0])}px` }}>
      <div style={{ position: 'absolute', left: 36, top: 30, display: 'flex', alignItems: 'center', gap: 18, font: `700 40px ${FONT}`, letterSpacing: '-0.02em' }}>
        <span style={{ width: 60, height: 60, borderRadius: 18, background: C.blue, color: '#fff', display: 'grid', placeItems: 'center', font: `800 32px ${FONT}` }}>{n}</span>{title}
      </div>
    </div>
  );
}

// s6 — um cartão por vez; cartão com cadeado espera o anterior
export function S6() {
  const { frame, at, p, pop, after } = useCue();
  const L = 120 + (760 - CARD_W) / 2, R = 1040 + (760 - CARD_W) / 2;
  const tryAt = at('one', 0.6);
  const shake = frame > tryAt && frame < tryAt + 14 ? Math.sin((frame - tryAt) * 1.6) * 12 : 0;
  const spendAt = at('open', -0.5);
  const doneA = frame >= spendAt;
  const opened = after('open');
  const cursor: Key[] = [
    [tryAt - 22, 700, 900, 1], [tryAt - 4, L + CARD_W - 70, 680 + CARD_H - 38, 1],
    [spendAt - 26, R + CARD_W - 120, 340 + CARD_H - 38, 1], [spendAt - 6, R + CARD_W - 110, 340 + CARD_H - 38, 1], [at('open', 0.8), R + CARD_W - 80, 860, 1],
  ];
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Bg />
      <Title size={76} style={{ position: 'absolute', top: 90, width: '100%', opacity: p('rules', 0.5), scale: ease(pop('rules'), [0, 1], [0.8, 1]) }}>Duas regras de ouro</Title>
      <Box n={1} title="Um cartão por vez" x={120} p={p('one', 0.5, -0.3)} />
      <Box n={2} title="Cadeado espera" x={1040} p={p('lock', 0.5, -0.3)} />
      {after('one', -0.3) && (
        <>
          <Card t="Trocar a senha do Wi-Fi" d="Senha forte no lugar da de fábrica." a="rede" cost={2} spent={1} owner="Ana" state="doing" mine btn="Gastar energia" primary style={{ left: L, top: 380, opacity: p('one', 0.4, -0.2) }} />
          <Card t="Instalar o antivírus" d="Baixar, instalar e atualizar." a="seg" cost={2} btn="Pegar" press={frame >= tryAt && frame < tryAt + 6 ? 1 : 0} style={{ left: L + shake, top: 680, opacity: p('one', 0.4) }} />
          <Toast at={tryAt + 2} text="Termine o seu cartão antes de pegar outro" len={2.4} />
        </>
      )}
      {after('lock', -0.3) && (
        <>
          <Card t="Conectar o PC no Wi-Fi" d="Escolher a rede e digitar a senha." a="rede" cost={1} spent={doneA ? 1 : 0} owner="Ana" state={doneA ? 'done' : 'doing'} mine={!doneA} btn="Gastar energia" primary
            style={{ left: R, top: 340, opacity: p('lock', 0.4, -0.2) }} />
          <div style={{ position: 'absolute', left: 1040 + 380 - 38, top: 340 + CARD_H + 18, width: 76, height: 76, borderRadius: '50%', background: opened ? C.greenSoft : C.surface, border: `3px solid ${opened ? C.green : C.line2}`, display: 'grid', placeItems: 'center', color: opened ? C.green : C.ink3, opacity: p('internet', 0.4, -0.2), rotate: `${opened ? ease(frame, [at('open'), at('open', 0.4)], [-25, 0], Easing.back(3)) : 0}deg`, scale: opened ? ease(pop('open'), [0, 1], [0.6, 1]) : 1 }}>
            <Icon n={opened ? 'unlock' : 'lock'} size={40} />
          </div>
          <Card t="Testar a internet" d="Abrir um site para conferir." a="rede" cost={1} state={opened ? 'todo' : 'locked'} dep="Conectar o PC no Wi-Fi" btn="Pegar"
            style={{ left: R, top: 340 + CARD_H + 112, opacity: p('internet', 0.4, -0.2), scale: opened ? ease(pop('open'), [0, 1], [0.94, 1]) : 1 }} />
        </>
      )}
      <Cursor path={cursor} clicks={[tryAt, spendAt]} />
      <Sfx at={at('open')} src="ding" volume={0.55} />
      <Sfx at={tryAt + 2} src="switch" volume={0.4} />
    </AbsoluteFill>
  );
}
