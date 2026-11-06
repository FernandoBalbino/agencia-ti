import { AbsoluteFill, Easing } from 'remotion';
import { Bg, C, CARD_W, Card, Center, Chip, Confetti, FONT, Icon, Logo, Sfx, TEAM, Title, ease, useCue } from '../kit';

const pill = (k: number) => ({ scale: ease(k, [0, 1], [0.4, 1], Easing.back(1.8)), opacity: ease(k, [0, 0.4], [0, 1]) });

// s1 — abertura: a sala vira uma agência
export function S1() {
  const { frame, p, pop, at } = useCue();
  const cards = [
    { t: 'Ligar o roteador Wi-Fi', a: 'rede' as const, x: 120, y: 160, r: -8, k: 'clients', d: 0 },
    { t: 'Criar a planilha de estoque', a: 'app' as const, x: 1380, y: 130, r: 7, k: 'clients', d: 0.15 },
    { t: 'Instalar o antivírus', a: 'seg' as const, x: 1420, y: 690, r: -5, k: 'clients', d: 0.3 },
    { t: 'Criar a conta no Windows', a: 'so' as const, x: 90, y: 700, r: 6, k: 'clients', d: 0.45 },
  ];
  return (
    <AbsoluteFill>
      <Bg />
      {cards.map((c, i) => (
        <div key={c.t} style={{ position: 'absolute', left: c.x, top: c.y + Math.sin((frame + i * 30) / 28) * 10, rotate: `${c.r}deg`, scale: 0.82 * ease(p(c.k, 0.6, c.d), [0, 1], [0.6, 1]), opacity: p(c.k, 0.5, c.d), width: CARD_W }}>
          <Card t={c.t} a={c.a} cost={i % 3 + 1} spent={i === 0 ? 1 : 0} state={i === 0 ? 'done' : 'todo'} btn="Pegar" style={{ position: 'relative' }} />
        </div>
      ))}
      <Center style={{ gap: 34 }}>
        <div style={{ scale: ease(p('title', 0.8), [0, 1], [0.7, 1]) }}><Logo size={120} p={p('title', 1)} /></div>
        <div style={{ display: 'flex', gap: 14, opacity: p('team', 0.5) }}>
          {Object.entries(TEAM).map(([n, c], i) => (
            <Chip key={n} bg={`${c}1f`} fg={c} size={30} style={pill(pop('team', i * 0.12))}><span style={{ width: 14, height: 14, borderRadius: 5, background: c }} />Equipe {n}</Chip>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
          {[['plan', 'Planejar'], ['split', 'Dividir o trabalho'], ['deadline', 'Entregar no prazo']].map(([k, t]) => (
            <Chip key={k} bg={C.surface} fg={C.ink} size={38} style={{ ...pill(pop(k)), border: `2px solid ${C.line}`, boxShadow: '0 18px 40px -22px rgba(20,26,46,.3)' }}><Icon n="check" size={36} color={C.green} />{t}</Chip>
          ))}
        </div>
      </Center>
      <Sfx at={at('title')} src="ding" volume={0.4} />
    </AbsoluteFill>
  );
}

// s11 — encerramento
export function S11() {
  const { p, pop, at, after } = useCue();
  const steps: [string, string, string][] = [['read', 'Ler o pedido', '1'], ['plan', 'Planejar', '2'], ['split', 'Dividir o trabalho', '3'], ['talk', 'Conversar', '4']];
  return (
    <AbsoluteFill>
      <Bg />
      <Center style={{ gap: 60 }}>
        <div style={{ display: 'flex', gap: 22, opacity: ease(p('ready', 0.5), [0, 1], [1, 0.25]) }}>
          {steps.map(([k, t, n]) => (
            <div key={k} style={{ ...pill(pop(k)), width: 330, padding: '30px 26px', borderRadius: 28, background: C.surface, border: `2px solid ${C.line}`, boxShadow: '0 18px 40px -22px rgba(20,26,46,.3)', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: FONT }}>
              <span style={{ width: 58, height: 58, borderRadius: 16, display: 'grid', placeItems: 'center', background: C.blueSoft, color: C.blue, font: `800 30px ${FONT}` }}>{n}</span>
              <span style={{ font: `700 36px ${FONT}`, letterSpacing: '-0.02em' }}>{t}</span>
            </div>
          ))}
        </div>
        {after('ready') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, translate: `0 ${ease(p('ready', 0.6), [0, 1], [40, 0])}px`, opacity: p('ready', 0.5) }}>
            <Logo size={110} p={p('ready', 1)} />
            <Title size={84} style={{ opacity: p('open', 0.5), scale: ease(pop('open'), [0, 1], [0.7, 1]) }}>A agência está aberta!</Title>
          </div>
        )}
      </Center>
      <Confetti at={at('open')} />
      <Sfx at={at('open')} src="ding" volume={0.5} />
    </AbsoluteFill>
  );
}
