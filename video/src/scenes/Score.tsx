import { AbsoluteFill, Easing } from 'remotion';
import { Bg, C, Confetti, FONT, Icon, Sfx, TEAM, Title, ease, useCue } from '../kit';

const RULES: [string, string, string, boolean][] = [['ten', '+10', 'por cartão do pedido pronto', false], ['twenty', '+20', 'se entregar tudo no prazo', false], ['bonus', '+2', 'por raio de energia que sobrar', false], ['minus', '−5', 'por cartão fora do pedido', true]];
const PODIUM = [
  { pos: 2, name: 'Byte', pts: 115, c: TEAM.Byte, cue: 'one', h: 250 },
  { pos: 1, name: 'Pixel', pts: 128, c: TEAM.Pixel, cue: 'champ', h: 360 },
  { pos: 3, name: 'Cache', pts: 90, c: TEAM.Cache, cue: 'reveal', h: 180 },
];

// s10 — pontuação e ranking revelado no telão
export function S10() {
  const { frame, at, p, pop, after } = useCue();
  const b = p('reveal', 0.5, -0.3);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Bg />
      {b < 1 && (
        <AbsoluteFill style={{ opacity: 1 - b, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 70 }}>
          <Title size={80}>Como a agência pontua</Title>
          <div style={{ display: 'flex', gap: 30 }}>
            {RULES.map(([k, n, t, neg]) => (
              <div key={k} style={{ width: 380, padding: '40px 34px', borderRadius: 32, background: C.surface, border: `2px solid ${C.line}`, boxShadow: '0 18px 40px -22px rgba(20,26,46,.3)', display: 'flex', flexDirection: 'column', gap: 14,
                scale: ease(pop(k), [0, 1], [0.4, 1], Easing.back(1.5)), opacity: ease(pop(k), [0, 0.3], [0, 1]) }}>
                <span style={{ font: `800 120px/1 ${FONT}`, letterSpacing: '-0.05em', color: neg ? C.red : C.green }}>{n}</span>
                <span style={{ font: `500 32px/1.25 ${FONT}`, color: C.ink2 }}>{t}</span>
              </div>
            ))}
          </div>
          {RULES.map(([k]) => <Sfx key={k} at={at(k)} src="switch" volume={0.35} />)}
        </AbsoluteFill>
      )}
      {b > 0 && (
        <AbsoluteFill style={{ opacity: b }}>
          <div style={{ position: 'absolute', top: 70, width: '100%', textAlign: 'center' }}>
            <div style={{ font: `600 26px ${FONT}`, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ink3 }}>No telão</div>
            <Title size={80}>Ranking da rodada</Title>
          </div>
          <div style={{ position: 'absolute', bottom: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 34 }}>
            {PODIUM.map((t) => {
              const k = pop(t.cue, 0, 14), on = after(t.cue);
              const pts = Math.round(t.pts * ease(frame, [at(t.cue), at(t.cue, 1)], [0, 1]));
              return (
                <div key={t.name} style={{ width: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: on ? 1 : 0.15 }}>
                  {t.pos === 1 && <div style={{ color: C.amber2, scale: ease(k, [0, 1], [0, 1], Easing.back(2)), translate: `0 ${Math.sin(frame / 10) * 6}px` }}><Icon n="crown" size={86} fill={`${C.amber2}66`} /></div>}
                  <span style={{ font: `800 58px ${FONT}`, color: t.c, letterSpacing: '-0.02em', scale: ease(k, [0, 1], [0.5, 1]) }}>{on ? t.name : '?'}</span>
                  <span style={{ font: `600 34px ${FONT}`, color: C.ink2 }}>{on ? `${pts} pts` : ''}</span>
                  <div style={{ width: '100%', height: t.h, borderRadius: '30px 30px 0 0', background: t.c, color: '#fff', display: 'grid', placeItems: 'center', font: `800 96px ${FONT}`, transformOrigin: 'bottom', scale: `1 ${on ? ease(k, [0, 1], [0.15, 1]) : 0.15}` }}>{t.pos}º</div>
                </div>
              );
            })}
          </div>
          <Sfx at={at('reveal')} src="whoosh" volume={0.5} /><Sfx at={at('one')} src="whoosh" volume={0.5} /><Sfx at={at('champ')} src="ding" volume={0.7} />
          <Confetti at={at('champ', 0.2)} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
