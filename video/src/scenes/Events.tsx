import { AbsoluteFill, Easing } from 'remotion';
import { Bg, C, FONT, Icon, Sfx, Title, Vignette, ease, useCue } from '../kit';

const TILES: { k: string; icon: Parameters<typeof Icon>[0]['n']; t: string; d: string; good?: boolean }[] = [
  { k: 'absent', icon: 'userx', t: 'Integrante faltou', d: 'Fica sem energia no dia' },
  { k: 'late', icon: 'clock', t: 'Peça atrasada', d: 'Um cartão trava até amanhã' },
  { k: 'crash', icon: 'cpu', t: 'O computador travou', d: 'Um cartão pronto volta' },
  { k: 'power', icon: 'zapoff', t: 'Queda de energia', d: 'Todo mundo perde 1 raio' },
  { k: 'extra', icon: 'package', t: 'Pedido extra', d: 'O cliente quer mais uma coisa' },
  { k: 'coffee', icon: 'coffee', t: 'Café do cliente', d: '+1 raio para todo mundo', good: true },
];

// s8 — imprevistos (e a boa notícia do café)
export function S8() {
  const { frame, at, p, pop } = useCue();
  const wob = Math.sin(frame / 3) * ease(frame, [at('imp'), at('imp', 0.4), at('imp', 1.2)], [0, 8, 0]);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Bg />
      <div style={{ position: 'absolute', top: 70, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26, opacity: p('imp', 0.4), scale: ease(pop('imp'), [0, 1], [0.7, 1]) }}>
        <span style={{ width: 96, height: 96, borderRadius: 28, background: C.amberSoft, color: C.amber, display: 'grid', placeItems: 'center', rotate: `${wob}deg` }}><Icon n="alert" size={58} /></span>
        <Title size={76}>Imprevistos acontecem!</Title>
      </div>
      <div style={{ position: 'absolute', left: 150, top: 270, width: 1620, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 30 }}>
        {TILES.map((t) => {
          const k = pop(t.k);
          return (
            <div key={t.k} style={{ height: 250, borderRadius: 30, padding: 34, display: 'flex', flexDirection: 'column', gap: 16, background: t.good ? C.greenSoft : C.surface, border: `3px solid ${t.good ? '#9fd9b4' : C.line}`,
              boxShadow: '0 18px 40px -22px rgba(20,26,46,.3)', scale: ease(k, [0, 1], [0.4, 1], Easing.back(1.4)), opacity: ease(k, [0, 0.3], [0, 1]) }}>
              <span style={{ width: 80, height: 80, borderRadius: 22, display: 'grid', placeItems: 'center', background: t.good ? '#fff' : C.amberSoft, color: t.good ? C.green : C.amber }}><Icon n={t.icon} size={46} /></span>
              <span style={{ font: `700 38px ${FONT}`, letterSpacing: '-0.02em', color: t.good ? C.green : C.ink }}>{t.t}</span>
              <span style={{ font: `500 26px ${FONT}`, color: C.ink2 }}>{t.d}</span>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', top: 870, width: '100%', textAlign: 'center', font: `600 36px ${FONT}`, color: C.green, opacity: p('good', 0.5) * ease(frame, [at('replan', -0.3), at('replan')], [1, 0]) }}>Às vezes a notícia é boa!</div>
      {TILES.map((t) => <Sfx key={t.k} at={at(t.k)} src="switch" volume={0.35} />)}
      <Vignette at={at('replan', -0.2)} kicker="imprevisto" name="Equipe Pixel" title="Peça atrasada" text="Replanejem juntos e sigam em frente!" len={2.4} icon="clock" />
    </AbsoluteFill>
  );
}
