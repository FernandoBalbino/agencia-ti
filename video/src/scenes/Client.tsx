import { AbsoluteFill, Easing } from 'remotion';
import { Bg, C, Chip, FONT, Icon, Panel, Sfx, ease, useCue } from '../kit';

const ASK = 'Vou abrir a papelaria na segunda. Preciso do computador do caixa funcionando, Wi-Fi com senha, antivírus e uma planilha de estoque.';
const NEEDS: [string, string][] = [['pc', 'Computador do caixa funcionando'], ['wifi', 'Wi-Fi com senha'], ['av', 'Antivírus'], ['sheet', 'Planilha de estoque']];

// s3 — cada rodada tem um cliente com um pedido
export function S3() {
  const { frame, at, p, pop } = useCue();
  const chars = Math.round(ease(frame, [at('read'), at('pc', 1.2)], [0, ASK.length], Easing.linear));
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Bg />
      <div style={{ position: 'absolute', left: 220, top: 120, font: `600 26px ${FONT}`, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ink3, opacity: p('client', 0.5) }}>Rodada 1 · o cliente</div>
      <div style={{ position: 'absolute', left: 220, top: 190, width: 1480, translate: `0 ${ease(p('client', 0.7), [0, 1], [40, 0])}px`, opacity: p('client', 0.5) }}>
        <Panel style={{ display: 'flex', gap: 46, alignItems: 'flex-start', padding: 54 }}>
          <div style={{ width: 170, height: 170, borderRadius: 50, background: C.amberSoft, display: 'grid', placeItems: 'center', flexShrink: 0, scale: ease(pop('rosa'), [0, 1], [0.6, 1]) }}>
            <svg width="130" height="130" viewBox="0 0 48 48">
              <circle cx="24" cy="10" r="6" fill="#9aa0b8" /><circle cx="24" cy="27" r="15" fill="#f4c7a1" />
              <path d="M9.5 24c1-8 7-13 14.5-13S37.5 16 38.5 24c-5-1-10-4-14.5-8-4 4-9 7-14.5 8z" fill="#9aa0b8" />
              <circle cx="18.5" cy="28" r="4" fill="#fff" stroke="#141a2e" strokeWidth="1.8" /><circle cx="29.5" cy="28" r="4" fill="#fff" stroke="#141a2e" strokeWidth="1.8" />
              <path d="M22.5 28h3" stroke="#141a2e" strokeWidth="1.8" /><circle cx="18.5" cy="28" r="1.4" fill="#141a2e" /><circle cx="29.5" cy="28" r="1.4" fill="#141a2e" />
              <path d="M19.5 35q4.5 3.5 9 0" fill="none" stroke="#141a2e" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ font: `600 22px ${FONT}`, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.ink3 }}>Pedido do cliente · Dona Rosa, dona da papelaria</div>
            <div style={{ font: `800 72px ${FONT}`, letterSpacing: '-0.03em' }}>Papelaria da Dona Rosa</div>
            <div style={{ font: `500 36px/1.4 ${FONT}`, color: C.ink2, minHeight: 150 }}>“{ASK.slice(0, chars)}<span style={{ opacity: chars < ASK.length ? 1 : 0, color: C.blue }}>|</span>”</div>
          </div>
        </Panel>
      </div>
      <div style={{ position: 'absolute', left: 220, top: 730, display: 'flex', gap: 18, flexWrap: 'wrap', width: 1500 }}>
        {NEEDS.map(([k, t]) => (
          <Chip key={k} size={34} bg={C.surface} fg={C.ink} style={{ border: `2px solid ${C.line}`, scale: ease(pop(k), [0, 1], [0.4, 1], Easing.back(1.6)), opacity: ease(pop(k), [0, 0.4], [0, 1]) }}>
            <Icon n="check" size={34} color={C.green} />{t}
          </Chip>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 220, top: 880, font: `600 32px ${FONT}`, color: C.blue, opacity: p('sheet', 0.5, 0.8) }}>Leia com atenção: é isso que a equipe vai entregar.</div>
      {NEEDS.map(([k]) => <Sfx key={k} at={at(k)} src="switch" volume={0.35} />)}
    </AbsoluteFill>
  );
}
