// Tela do aluno desenhada para o vídeo (mesmas medidas em todas as cenas do quadro).
import { C, CARD_H, Bolts, Column, Face, FONT, Icon, Logo, SHADOW, TEAM, ease } from '../kit';
import type { Area } from '../kit';

export const COLX = [420, 917, 1414];
export const COLY = 300;
export const COLS = ['A fazer', 'Fazendo', 'Pronto'];
export const slot = (col: number, i: number) => ({ x: COLX[col] + 14, y: COLY + 66 + i * (CARD_H + 16) });
export const BANKX = 24, BANKW = 332;
export const bankY = (i: number) => 520 + i * 68;

export type Member = { name: string; e?: number; max?: number; tag?: 'faltou' | 'ajuda' };
export function Sidebar({ members, bankCount, team = 'Pixel' }: { members: Member[]; bankCount: number; team?: keyof typeof TEAM }) {
  const tc = TEAM[team];
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 380, height: 1080, background: C.surface, borderRight: `2px solid ${C.line}`, padding: '38px 28px', fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Logo size={30} />
      <span style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px 8px 14px', borderRadius: 999, background: `${tc}1f`, color: tc, font: `700 21px ${FONT}` }}>
        <span style={{ width: 12, height: 12, borderRadius: 4, background: tc }} />Equipe {team}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {members.map((m, i) => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 10px', borderRadius: 14, background: i === 0 ? C.surface2 : 'transparent' }}>
            <Face name={m.name} size={40} />
            <span style={{ flex: 1, font: `600 21px ${FONT}` }}>{m.name}{i === 0 && <small style={{ color: C.ink3, fontWeight: 500 }}> você</small>}</span>
            {m.tag ? <span style={{ font: `700 15px ${FONT}`, padding: '3px 10px', borderRadius: 99, background: m.tag === 'faltou' ? C.redSoft : C.amberSoft, color: m.tag === 'faltou' ? C.red : C.amber }}>{m.tag}</span>
              : m.max ? <Bolts n={m.e ?? 0} max={m.max} size={19} /> : null}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 28, right: 28, top: 440, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', font: `700 22px ${FONT}` }}>Banco de cartões
          <span style={{ minWidth: 34, height: 30, padding: '0 9px', borderRadius: 9, background: C.blueSoft, color: C.blue, display: 'grid', placeItems: 'center', font: `700 17px ${FONT}` }}>{bankCount}</span>
        </div>
        <div style={{ font: `400 16px ${FONT}`, color: C.ink2 }}>Leve para A fazer só o que o cliente pediu.</div>
      </div>
    </div>
  );
}

export type BankRow = { t: string; c: number; a: Area; gone?: number; hi?: number; sel?: number; stamp?: number; dx?: number; dy?: number };
const DOT: Record<Area, string> = { hw: C.slate, so: C.blue, rede: C.teal, app: C.violet, seg: C.red, atend: C.green };
export function Bank({ rows }: { rows: BankRow[] }) {
  return (
    <>
      {rows.map((r, i) => (
        <div key={r.t} style={{
          position: 'absolute', left: BANKX + (r.dx ?? 0), top: bankY(i) + (r.dy ?? 0), width: BANKW, height: 58, borderRadius: 14, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 12,
          background: r.sel ? C.blueSoft : r.hi ? C.amberSoft : C.surface, border: `2px ${r.sel || r.hi ? 'solid' : 'dashed'} ${r.sel ? C.blue : r.hi ? C.amber2 : C.line2}`,
          opacity: 1 - (r.gone ?? 0), scale: 1 - (r.gone ?? 0) * 0.1, font: `500 18px ${FONT}`, zIndex: r.dx ? 30 : 1, boxShadow: r.dx ? SHADOW : undefined,
        }}>
          <span style={{ width: 11, height: 11, borderRadius: 4, background: DOT[r.a], flexShrink: 0 }} />
          <span style={{ flex: 1, lineHeight: 1.2 }}>{r.t}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, font: `700 16px ${FONT}`, color: C.amber }}><Icon n="zap" size={15} />{r.c}</span>
          <Icon n="plus" size={22} color={C.blue} />
          {(r.stamp ?? 0) > 0 && (
            <div style={{ position: 'absolute', inset: -6, display: 'grid', placeItems: 'center', borderRadius: 16, background: 'rgba(253,236,237,.92)', border: `3px solid ${C.red}`, opacity: ease(r.stamp!, [0, 0.4], [0, 1]), scale: ease(r.stamp!, [0, 0.5], [1.6, 1]) }}>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center', font: `800 22px ${FONT}`, color: C.red, textTransform: 'uppercase', letterSpacing: '0.06em' }}><Icon n="x" size={24} width={3} />Fora do pedido</span>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export function Header({ title, who, ask, phase, time, energy, done, total, tip, tipColor }: {
  title: string; who: string; ask: string; phase: string; time: string; energy?: [number, number]; done: number; total: number; tip: string; tipColor?: string;
}) {
  return (
    <>
      <div style={{ position: 'absolute', left: 420, top: 34, width: 1000, fontFamily: FONT }}>
        <div style={{ font: `600 17px ${FONT}`, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.ink3 }}>Pedido do cliente · {who}</div>
        <div style={{ font: `700 52px ${FONT}`, letterSpacing: '-0.025em', marginTop: 4 }}>{title}</div>
        <div style={{ font: `400 22px ${FONT}`, color: C.ink2, marginTop: 6 }}>“{ask}”</div>
      </div>
      <div style={{ position: 'absolute', right: 40, top: 40, display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT }}>
        <span style={{ height: 50, padding: '0 18px', borderRadius: 14, background: phase.startsWith('Plan') ? C.violetSoft : C.blueSoft, color: phase.startsWith('Plan') ? C.violet : C.blue, display: 'grid', placeItems: 'center', font: `700 21px ${FONT}` }}>{phase}</span>
        <span style={{ height: 62, padding: '0 20px', borderRadius: 16, background: C.surface, border: `2px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 9, font: `700 32px ${FONT}` }}><Icon n="clock" size={26} color={C.ink2} />{time}</span>
        {energy && (
          <span style={{ padding: '8px 16px', borderRadius: 16, background: C.amberSoft, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Bolts n={energy[0]} max={energy[1]} size={32} /><small style={{ font: `600 14px ${FONT}`, color: C.amber }}>sua energia</small>
          </span>
        )}
      </div>
      <div style={{ position: 'absolute', left: 420, top: 208, width: 1460, height: 72, borderRadius: 18, background: C.surface, border: `2px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 26, padding: '0 22px', fontFamily: FONT }}>
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 8, font: `400 18px ${FONT}`, color: C.ink2 }}>
          <span><b style={{ color: C.ink }}>{done}</b> de {total} cartões do pedido prontos</span>
          <div style={{ height: 9, borderRadius: 9, background: C.slateSoft, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(done / total) * 100}%`, background: C.blue }} /></div>
        </div>
        <span style={{ font: `600 21px ${FONT}`, color: tipColor ?? C.ink2 }}>{tip}</span>
      </div>
    </>
  );
}

export function Columns({ counts, armed = [] }: { counts: number[]; armed?: number[] }) {
  return (
    <>
      {COLS.map((t, i) => (
        <div key={t}>
          <Column x={COLX[i]} y={COLY} w={466} h={760} title={t} n={counts[i]} />
          {armed.includes(i) && <div style={{ position: 'absolute', left: COLX[i], top: COLY, width: 466, height: 760, borderRadius: 26, border: `3px dashed ${C.blue}`, background: 'rgba(47,107,255,.06)' }} />}
        </div>
      ))}
    </>
  );
}

export const ROSA = {
  title: 'Papelaria da Dona Rosa', who: 'Dona Rosa, dona da papelaria',
  ask: 'Preciso do computador do caixa funcionando, Wi-Fi com senha, antivírus e uma planilha de estoque.',
};
