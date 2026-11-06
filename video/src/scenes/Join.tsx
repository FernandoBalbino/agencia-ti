import { AbsoluteFill, Easing } from 'remotion';
import { Bg, C, Chip, Cursor, FONT, Face, Icon, Logo, Panel, SHADOW, Sfx, TEAM, ease, lerp, useCue } from '../kit';
import type { Key } from '../kit';

const TEAMS = [['Pixel', TEAM.Pixel], ['Byte', TEAM.Byte], ['Cache', TEAM.Cache]] as const;
const KIDS = ['Ana', 'Bruno', 'Carla', 'Davi', 'Enzo', 'Fabi', 'Gabi', 'Heitor', 'Iara'];
const DEST = [0, 0, 0, 1, 1, 1, 2, 2, 2]; // equipe de cada um
const poolPos = (i: number) => ({ x: 250 + (i % 5) * 290, y: 330 + Math.floor(i / 5) * 76 });
const slotPos = (team: number, k: number) => ({ x: 260 + team * 480, y: 600 + k * 70 });

function Field({ label, value, caret, w = 520 }: { label: string; value: string; caret: boolean; w?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: w, fontFamily: FONT }}>
      <span style={{ font: `600 20px ${FONT}`, color: C.ink2 }}>{label}</span>
      <div style={{ height: 70, borderRadius: 16, border: `2px solid ${caret ? C.blue : C.line2}`, boxShadow: caret ? `0 0 0 5px ${C.blueSoft}` : undefined, display: 'flex', alignItems: 'center', justifyContent: label.startsWith('Código') ? 'center' : 'flex-start', padding: '0 22px', font: label.startsWith('Código') ? `800 40px ${FONT}` : `500 28px ${FONT}`, letterSpacing: label.startsWith('Código') ? '0.4em' : 0 }}>
        {value}{caret && <span style={{ width: 3, height: 36, background: C.blue, marginLeft: 4 }} />}
      </div>
    </div>
  );
}

// s2 — entrar com código e nome, tela cheia, professor monta as equipes
export function S2() {
  const { frame, fps, at, p, after } = useCue();
  const typed = (word: string, cue: string) => word.slice(0, Math.max(0, Math.floor((frame - at(cue)) / 5) + 1) * (after(cue) ? 1 : 0));
  const code = typed('K5LC', 'code'), name = typed('Ana', 'name');
  const enter = at('full') - 10;
  const part2 = p('teams', 0.5, -0.35);
  // tela cheia: o cartão de entrada cresce até ocupar tudo
  const full = ease(frame, [at('full'), at('full') + 18], [0, 1]);
  const keys = [...Array(4)].map((_, i) => at('code') + i * 5).concat([...Array(3)].map((_, i) => at('name') + i * 5));

  // parte 2: alunos vão para as equipes (Ana arrastada, Bruno por clique, o resto em sequência)
  const t0 = at('teams', 0.2);
  const rest = Math.max(at('sit', -0.4), t0 + 2.1 * fps);
  const moveAt = [t0 + 0.0 * fps, t0 + 1.5 * fps, ...KIDS.slice(2).map((_, i) => rest + i * 4)];
  const moveP = (i: number) => ease(frame, [moveAt[i], moveAt[i] + (i === 0 ? 0.8 : 0.45) * fps], [0, 1], i === 0 ? Easing.bezier(0.65, 0, 0.35, 1) : undefined); // Ana segue o cursor
  const count = [0, 0, 0];
  const chipPos = KIDS.map((_, i) => { const k = count[DEST[i]]++; const a = poolPos(i), b = slotPos(DEST[i], k); const m = moveP(i); return { x: lerp(m, a.x, b.x), y: lerp(m, a.y, b.y), m }; });
  const selBruno = frame >= t0 + 1.0 * fps && frame < moveAt[1];
  const cursor: Key[] = after('teams') ? [
    [t0 - 10, chipPos[0].x + 60, 360, 1], [t0, poolPos(0).x + 60, poolPos(0).y + 30, 1], [t0 + 0.8 * fps, slotPos(0, 0).x + 60, slotPos(0, 0).y + 30, 1],
    [t0 + 1.0 * fps, poolPos(1).x + 60, poolPos(1).y + 30, 1], [t0 + 1.3 * fps, 480, 760, 1], [Math.max(at('sit'), t0 + 2.4 * fps), 1500, 980, 1],
  ] : [[at('code') - 14, 1100, 760, 1], [at('code') - 4, 960, 500, 1], [at('name') - 4, 960, 650, 1], [enter - 6, 960, 790, 1]];
  const clicks = after('teams') ? [t0, t0 + 1.0 * fps, t0 + 1.4 * fps] : [at('code') - 4, at('name') - 4, enter];

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Bg />
      {part2 < 1 && (
        <AbsoluteFill style={{ opacity: 1 - part2, display: 'grid', placeItems: 'center' }}>
          {keys.map((k) => <Sfx key={k} at={k} src="switch" volume={0.25} />)}
          <div style={{ scale: lerp(full, 1, 1.03), opacity: 1 - full * 0.15 }}>
            <Panel style={{ width: 640, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, padding: 44 }}>
              <Logo size={42} />
              <div style={{ font: `700 44px ${FONT}`, letterSpacing: '-0.02em' }}>Entrar na agência</div>
              <Field label="Código da sala" value={code} caret={frame >= at('code') - 4 && frame < at('name') - 4} />
              <Field label="Seu nome" value={name} caret={frame >= at('name') - 4 && frame < enter} />
              <div style={{ width: 520, height: 70, borderRadius: 16, background: C.blue, color: '#fff', display: 'grid', placeItems: 'center', font: `700 28px ${FONT}`, scale: frame > enter && frame < enter + 6 ? 0.96 : 1 }}>Entrar</div>
            </Panel>
          </div>
          {full > 0 && (
            <AbsoluteFill style={{ border: `${lerp(full, 0, 18)}px solid ${C.blue}`, borderRadius: lerp(full, 60, 0), opacity: ease(frame, [at('full') + 18, at('teams', -0.4)], [1, 0.2]) }}>
              <div style={{ position: 'absolute', top: 40, left: '50%', translate: '-50% 0', scale: lerp(full, 0.6, 1) }}>
                <Chip size={30} bg={C.ink} fg="#fff"><Icon n="max" size={30} />Tela cheia</Chip>
              </div>
            </AbsoluteFill>
          )}
        </AbsoluteFill>
      )}
      {part2 > 0 && (
        <AbsoluteFill style={{ opacity: part2 }}>
          <div style={{ position: 'absolute', left: 200, top: 80, display: 'flex', alignItems: 'baseline', gap: 24 }}>
            <span style={{ font: `700 50px ${FONT}`, letterSpacing: '-0.02em' }}>Tela do professor</span>
            <span style={{ font: `500 26px ${FONT}`, color: C.ink2 }}>arraste os alunos, ou clique no aluno e depois na equipe</span>
          </div>
          <div style={{ position: 'absolute', left: 200, top: 230, width: 1520, height: 250, borderRadius: 26, border: `2px dashed ${C.line2}`, background: C.surface2 }}>
            <div style={{ position: 'absolute', left: 28, top: 22, font: `700 26px ${FONT}` }}>Sem equipe</div>
          </div>
          {TEAMS.map(([n, c], t) => (
            <div key={n} style={{ position: 'absolute', left: 230 + t * 480, top: 520, width: 440, height: 300, borderRadius: 26, background: C.surface, border: `2px ${frame > t0 + 1.0 * fps && frame < moveAt[1] + 8 && t === 0 ? 'solid' : 'dashed'} ${frame > t0 + 1.0 * fps && frame < moveAt[1] + 8 && t === 0 ? C.blue : C.line2}`, boxShadow: SHADOW }}>
              <div style={{ position: 'absolute', left: 26, top: 22, display: 'flex', alignItems: 'center', gap: 10, font: `700 28px ${FONT}`, color: c }}><span style={{ width: 16, height: 16, borderRadius: 5, background: c }} />{n}</div>
            </div>
          ))}
          {KIDS.map((k, i) => (
            <div key={k} style={{ position: 'absolute', left: chipPos[i].x, top: chipPos[i].y, width: 260, height: 56, borderRadius: 16, background: C.surface, border: `2px solid ${(i === 1 && selBruno) ? C.blue : C.line}`, boxShadow: (i === 1 && selBruno) ? `0 0 0 5px ${C.blueSoft}` : chipPos[i].m > 0 && chipPos[i].m < 1 ? SHADOW : undefined, display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px', font: `600 24px ${FONT}`, zIndex: chipPos[i].m > 0 && chipPos[i].m < 1 ? 20 : 2, scale: chipPos[i].m > 0 && chipPos[i].m < 1 ? 1.05 : 1 }}>
              <Face name={k} size={36} />{k}
            </div>
          ))}
          {after('sit') && (
            <div style={{ position: 'absolute', left: '50%', top: 880, translate: `-50% ${ease(p('sit', 0.5), [0, 1], [30, 0])}px`, opacity: p('sit', 0.4) }}>
              <Chip size={34} bg={C.ink} fg="#fff">Quem é da mesma equipe senta junto</Chip>
            </div>
          )}
          {after('talk') && TEAMS.map(([n], t) => (
            <div key={n} style={{ position: 'absolute', left: 560 + t * 480, top: 470, scale: ease(p('talk', 0.4, t * 0.15), [0, 1], [0, 1]), width: 90, height: 70, borderRadius: '24px 24px 24px 6px', background: C.blue, display: 'grid', placeItems: 'center', boxShadow: SHADOW }}>
              <span style={{ display: 'flex', gap: 7 }}>{[0, 1, 2].map((d) => <span key={d} style={{ width: 11, height: 11, borderRadius: 6, background: '#fff', opacity: 0.5 + 0.5 * Math.abs(Math.sin((frame - d * 5) / 6)) }} />)}</span>
            </div>
          ))}
        </AbsoluteFill>
      )}
      <Cursor path={cursor} clicks={clicks} />
    </AbsoluteFill>
  );
}
