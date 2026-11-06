import React, { createContext, useContext } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { loadFont } from '@remotion/google-fonts/Outfit';

// Mesmas cores e fonte do jogo, para o vídeo parecer a própria Agência TI.
export const FONT = loadFont('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin', 'latin-ext'] }).fontFamily;
export const C = {
  bg: '#f3f5f9', surface: '#ffffff', surface2: '#f7f8fb', col: '#eceff5', line: '#e5e8ef', line2: '#d6dbe5',
  ink: '#141a2e', ink2: '#545d72', ink3: '#8a92a6', blue: '#2f6bff', blueSoft: '#e9f0ff', amber: '#c27c00', amber2: '#f5a400',
  amberSoft: '#fff4d9', green: '#138a43', greenSoft: '#e3f6ea', red: '#d93b41', redSoft: '#fdeced', violet: '#6b4ef0',
  violetSoft: '#efebff', teal: '#0b8f8a', tealSoft: '#ddf5f3', slate: '#566479', slateSoft: '#edf0f5',
};
export const TEAM = { Pixel: '#2F6BFF', Byte: '#7C5CFF', Cache: '#0EA5A0', Kernel: '#F97316' };
export type Area = 'hw' | 'so' | 'rede' | 'app' | 'seg' | 'atend';
export const AREA: Record<Area, [string, string, string]> = {
  hw: ['Hardware', C.slateSoft, C.slate], so: ['Sistema', C.blueSoft, C.blue], rede: ['Rede básica', C.tealSoft, C.teal],
  app: ['Aplicativos', C.violetSoft, C.violet], seg: ['Segurança', C.redSoft, C.red], atend: ['Atendimento', C.greenSoft, C.green],
};
export const SHADOW = '0 2px 4px rgba(20,26,46,.05), 0 18px 40px -22px rgba(20,26,46,.28)';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const ease = (f: number, i: number[], o: number[], e = OUT) => interpolate(f, i, o, { ...clamp, easing: e });

// ---------- marcas da narração (em quadros, relativas à cena) ----------
type Cues = { cues: Record<string, number>; dur: number };
export const CueCtx = createContext<Cues>({ cues: {}, dur: 0 });
export function useCue() {
  const { cues, dur } = useContext(CueCtx);
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const at = (name: string, delay = 0) => (cues[name] ?? 0) + delay * fps;
  const p = (name: string, len = 0.5, delay = 0) => ease(frame, [at(name, delay), at(name, delay) + len * fps], [0, 1]);
  const pop = (name: string, delay = 0, damping = 12) => spring({ frame: frame - at(name, delay), fps, config: { damping, stiffness: 170, mass: 0.8 } });
  const after = (name: string, delay = 0) => frame >= at(name, delay);
  return { frame, fps, dur, at, p, pop, after };
}

// ---------- ícones (traços do Lucide, ISC) ----------
const PATHS: Record<string, ReactNode> = {
  zap: <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  unlock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></>,
  check: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  coffee: <><path d="M10 2v2" /><path d="M14 2v2" /><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" /><path d="M6 2v2" /></>,
  hand: <path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />,
  userx: <><circle cx="9" cy="7" r="4" /><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="m17 8 5 5" /><path d="m22 8-5 5" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  cpu: <><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2" /></>,
  zapoff: <><path d="M10.5 4.9 13.1 2.2a.5.5 0 0 1 .86.46l-1.38 4.32" /><path d="M15.7 10H20a1 1 0 0 1 .78 1.63l-1.72 1.77" /><path d="m16.3 16.3-3.4 3.5a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 13 13H4a1 1 0 0 1-.78-1.63l4.5-4.64" /><path d="m2 2 20 20" /></>,
  package: <><path d="m16 16 2 2 4-4" /><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" /><path d="M3.3 7 12 12l8.7-5" /><path d="M12 22V12" /></>,
  plus: <path d="M5 12h14M12 5v14" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  crown: <><path d="M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.3l4.27-3.67a.5.5 0 0 1 .8.52l-2.83 10.24a1 1 0 0 1-.96.74H5.81a1 1 0 0 1-.96-.74L2.02 6.02a.5.5 0 0 1 .8-.52L7.1 9.17a1 1 0 0 0 1.51-.3z" /><path d="M5 21h14" /></>,
  max: <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />,
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>,
};
export function Icon({ n, size = 24, color = 'currentColor', fill = 'none', width = 2, style }: { n: keyof typeof PATHS; size?: number; color?: string; fill?: string; width?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>{PATHS[n]}</svg>;
}

// ---------- fundo: manchas suaves nas cores das equipes ----------
export function Bg() {
  const f = useCurrentFrame();
  const blob = (c: string, x: number, y: number, s: number, k: number) => (
    <div style={{ position: 'absolute', left: x + Math.sin((f + k * 40) / 70) * 60, top: y + Math.cos((f + k * 30) / 80) * 40, width: s, height: s, borderRadius: '50%', background: c, opacity: 0.1, filter: 'blur(80px)' }} />
  );
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden', fontFamily: FONT }}>
      {blob(TEAM.Pixel, -120, -160, 700, 0)}{blob(TEAM.Byte, 1350, 520, 760, 1)}{blob(TEAM.Cache, 700, 760, 600, 2)}
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${C.line2} 1.4px, transparent 1.6px)`, backgroundSize: '34px 34px', opacity: 0.55 }} />
    </AbsoluteFill>
  );
}

// ---------- câmera: zoom e deslocamento por pontos-chave ----------
export type Key = [frame: number, x: number, y: number, scale: number];
export function Camera({ keys, children }: { keys: Key[]; children: ReactNode }) {
  const f = useCurrentFrame();
  const ks = [...keys].sort((a, b) => a[0] - b[0]);
  const fr = ks.map((k) => k[0]);
  const pick = (j: number) => (fr.length > 1 ? interpolate(f, fr, ks.map((k) => k[j]), { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) }) : ks[0][j]);
  const s = pick(3);
  // (x, y) = ponto da tela de 1920×1080 que fica no centro
  return <AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(960px, 540px) scale(${s}) translate(${-pick(1)}px, ${-pick(2)}px)` }}>{children}</AbsoluteFill>;
}

// ---------- sons (biblioteca de sons do Remotion, em public/sfx) ----------
export const Sfx = ({ at, src, volume = 0.5 }: { at: number; src: 'whoosh' | 'mouse-click' | 'ding' | 'switch'; volume?: number }) => (
  <Sequence from={Math.round(at)} durationInFrames={90} layout="none"><Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} /></Sequence>
);

/** ponteiro do mouse que anda entre pontos e clica (com som e onda) */
export function Cursor({ path, clicks = [] }: { path: Key[]; clicks?: number[] }) {
  const f = useCurrentFrame();
  if (!path.length || f < path[0][0]) return null;
  const fr = path.map((k) => k[0]);
  const x = interpolate(f, fr, path.map((k) => k[1]), { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const y = interpolate(f, fr, path.map((k) => k[2]), { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const c = clicks.map((k) => f - k).find((d) => d >= 0 && d < 14);
  return (
    <div style={{ position: 'absolute', left: x, top: y, zIndex: 60, pointerEvents: 'none' }}>
      {clicks.map((k) => <Sfx key={k} at={k} src="mouse-click" volume={0.7} />)}
      {c !== undefined && <div style={{ position: 'absolute', left: -36, top: -36, width: 72, height: 72, borderRadius: '50%', border: `5px solid ${C.blue}`, opacity: 1 - c / 14, scale: 0.3 + c / 10 }} />}
      <svg width="54" height="54" viewBox="0 0 24 24" style={{ scale: c !== undefined && c < 5 ? 0.85 : 1, filter: 'drop-shadow(0 6px 10px rgba(20,26,46,.35))' }}>
        <path d="M4 2l15 9.5-6.6 1.4L16 21l-3 1.3-3.6-8L4 18z" fill={C.ink} stroke="#fff" strokeWidth="1.4" />
      </svg>
    </div>
  );
}

/** explosão de partículas guiada pelo quadro */
export function Burst({ p, color = C.green, n = 14, r = 220, x = 0, y = 0 }: { p: number; color?: string; n?: number; r?: number; x?: number; y?: number }) {
  if (p <= 0 || p >= 1) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none', zIndex: 40 }}>
      <div style={{ position: 'absolute', width: r * 2 * p, height: r * 2 * p, left: -r * p, top: -r * p, borderRadius: '50%', border: `${8 * (1 - p)}px solid ${color}`, opacity: 1 - p }} />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2, d = r * (0.3 + 0.9 * p);
        return <div key={i} style={{ position: 'absolute', width: 16 * (1 - p) + 5, height: 16 * (1 - p) + 5, borderRadius: '50%', background: i % 2 ? color : C.amber2, left: Math.cos(a) * d, top: Math.sin(a) * d, opacity: 1 - p }} />;
      })}
    </div>
  );
}

/** "+10" que sobe e some */
export function Points({ p, text, color = C.green, x, y, size = 96 }: { p: number; text: string; color?: string; x: number; y: number; size?: number }) {
  if (p <= 0 || p >= 1) return null;
  return <div style={{ position: 'absolute', left: x, top: y - p * 110, translate: '-50% -50%', scale: ease(p, [0, 0.15], [0.4, 1]), font: `800 ${size}px ${FONT}`, color, opacity: ease(p, [0.7, 1], [1, 0]), zIndex: 45 }}>{text}</div>;
}

/** confete guiado pelo quadro */
export function Confetti({ at, n = 120 }: { at: number; n?: number }) {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 150) return null;
  const cols = Object.values(TEAM).concat(C.amber2);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 70 }}>
      {Array.from({ length: n }, (_, i) => {
        const vx = (random(`vx${i}`) - 0.5) * 34, vy = -random(`vy${i}`) * 34 - 10;
        const x = 960 + vx * f, y = 520 + vy * f + 0.7 * f * f;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 16, height: 9, background: cols[i % cols.length], rotate: `${f * (random(`r${i}`) * 20 - 10)}deg`, opacity: ease(f, [110, 150], [1, 0]) }} />;
      })}
    </AbsoluteFill>
  );
}

// ---------- peças do jogo ----------
const HUES = ['#2F6BFF', '#7C5CFF', '#0EA5A0', '#F97316', '#E5487D', '#16A34A', '#D49A00', '#5B6B8C'];
export function Face({ name, size = 44, off }: { name: string; size?: number; off?: boolean }) {
  const h = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  return <div style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', background: off ? C.line2 : h, color: off ? C.ink3 : '#fff', font: `700 ${size * 0.42}px ${FONT}`, boxShadow: `0 0 0 3px ${C.surface}`, flexShrink: 0 }}>{name.slice(0, 1)}</div>;
}

export function Bolts({ n, max, size = 30 }: { n: number; max: number; size?: number }) {
  return <div style={{ display: 'flex', gap: 2 }}>{Array.from({ length: max }, (_, i) => <Icon key={i} n="zap" size={size} color={i < n ? C.amber2 : C.line2} fill={i < n ? C.amber2 : 'none'} />)}</div>;
}

export function Tag({ a }: { a: Area }) {
  const [label, bg, fg] = AREA[a];
  return <span style={{ font: `600 17px ${FONT}`, padding: '5px 13px', borderRadius: 9, background: bg, color: fg, whiteSpace: 'nowrap' }}>{label}</span>;
}

export type CardState = 'todo' | 'doing' | 'done' | 'locked' | 'blocked';
export const CARD_W = 438, CARD_H = 214;
/** cartão do quadro, igual ao do jogo (largura 438 px) */
export function Card({ t, d, a, cost, spent = 0, owner, state = 'todo', mine, dep, btn, primary, help, press = 0, glow = 0, style }: {
  t: string; d?: string; a: Area; cost: number; spent?: number; owner?: string; state?: CardState; mine?: boolean; dep?: string;
  btn?: string; primary?: boolean; help?: string; press?: number; glow?: number; style?: CSSProperties;
}) {
  const done = state === 'done', locked = state === 'locked';
  const border = mine ? C.blue : state === 'blocked' ? '#f2d28d' : glow ? C.amber2 : 'transparent';
  return (
    <div style={{
      position: 'absolute', width: CARD_W, height: CARD_H, background: locked ? C.surface2 : C.surface, borderRadius: 20, padding: '18px 20px 16px',
      display: 'flex', flexDirection: 'column', gap: 8, boxShadow: locked || done ? 'none' : mine ? `0 0 0 5px ${C.blueSoft}, ${SHADOW}` : glow ? `0 0 0 ${6 * glow}px ${C.amberSoft}, ${SHADOW}` : SHADOW,
      border: `2px solid ${locked || done ? C.line : border}`, fontFamily: FONT, ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34 }}>
        <Tag a={a} />
        <div style={{ flex: 1 }} />
        {owner && <Face name={owner} size={34} />}
      </div>
      <div style={{ font: `600 23px/1.2 ${FONT}`, color: locked || done ? C.ink2 : C.ink, letterSpacing: '-0.01em' }}>{t}</div>
      {d && <div style={{ font: `400 17px ${FONT}`, color: C.ink3 }}>{d}</div>}
      {help && <div style={{ alignSelf: 'flex-start', font: `700 16px ${FONT}`, color: C.amber, background: C.amberSoft, padding: '4px 11px', borderRadius: 8, display: 'flex', gap: 6, alignItems: 'center' }}><Icon n="hand" size={16} />{help}</div>}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, font: `700 17px ${FONT}`, color: C.ink2 }}><Icon n="zap" size={18} color={C.amber2} />{spent}/{cost}</span>
        <div style={{ flex: 1, height: 9, borderRadius: 9, background: C.slateSoft, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(spent / cost) * 100}%`, background: done ? C.green : C.blue, borderRadius: 9 }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: 44 }}>
        {done ? <span style={{ display: 'flex', gap: 7, alignItems: 'center', font: `600 18px ${FONT}`, color: C.green }}><Icon n="check" size={20} />Pronto</span>
          : locked ? <span style={{ display: 'flex', gap: 7, alignItems: 'center', font: `600 17px ${FONT}`, color: C.ink3 }}><Icon n="lock" size={18} />Depois de: {dep}</span>
          : state === 'blocked' ? <span style={{ display: 'flex', gap: 7, alignItems: 'center', font: `600 17px ${FONT}`, color: C.amber }}><Icon n="clock" size={18} />Peça atrasada: volta amanhã</span>
          : btn ? <span style={{ display: 'flex', gap: 7, alignItems: 'center', height: 44, padding: '0 18px', borderRadius: 12, font: `600 18px ${FONT}`, background: primary ? C.blue : C.surface, color: primary ? '#fff' : C.ink, border: `2px solid ${primary ? C.blue : C.line2}`, scale: 1 - press * 0.08 }}>
              {(btn.includes('Gastar') || btn.includes('Ajudar')) && <Icon n="zap" size={18} />}{btn}</span> : null}
      </div>
    </div>
  );
}

export function Column({ x, y, w = 470, h = 760, title, n }: { x: number; y: number; w?: number; h?: number; title: string; n: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 26, background: C.col, padding: '18px 20px', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, font: `600 22px ${FONT}`, color: C.ink }}>
        {title}<span style={{ minWidth: 34, height: 30, padding: '0 9px', borderRadius: 9, background: C.blueSoft, color: C.blue, display: 'grid', placeItems: 'center', font: `700 17px ${FONT}` }}>{n}</span>
      </div>
    </div>
  );
}

export function Logo({ size = 40, p = 1 }: { size?: number; p?: number }) {
  const sq = (x: number, y: number, soft: boolean, k: number) => (
    <rect x={x} y={y} width="11" height="11" rx="3.5" fill={soft ? '#b9cdff' : C.blue}
      style={{ transformBox: 'fill-box', transformOrigin: 'center', scale: ease(p, [k * 0.12, k * 0.12 + 0.5], [0, 1], Easing.back(2)) }} />
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.32, font: `700 ${size}px ${FONT}`, color: C.ink, letterSpacing: '-0.02em' }}>
      <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 32 32">{sq(3, 3, false, 0)}{sq(18, 3, true, 1)}{sq(3, 18, true, 3)}{sq(18, 18, false, 2)}</svg>
      <span style={{ opacity: ease(p, [0.3, 0.8], [0, 1]) }}>Agência <b style={{ color: C.blue, fontWeight: 800 }}>TI</b></span>
    </div>
  );
}

export function Chip({ children, bg = C.blueSoft, fg = C.blue, size = 26, style }: { children: ReactNode; bg?: string; fg?: string; size?: number; style?: CSSProperties }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: `${size * 0.35}px ${size * 0.7}px`, borderRadius: size * 0.5, background: bg, color: fg, font: `700 ${size}px ${FONT}`, whiteSpace: 'nowrap', ...style }}>{children}</span>;
}

export const Panel = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ background: C.surface, borderRadius: 28, border: `2px solid ${C.line}`, boxShadow: SHADOW, padding: 36, fontFamily: FONT, ...style }}>{children}</div>
);

/** vinheta de imprevisto (laranja) ou boa notícia/entrega (verde), igual à do jogo */
export function Vignette({ at, kicker, name, title, text, good, icon = 'alert' }: { at: number; kicker: string; name: string; title: string; text: string; good?: boolean; icon?: keyof typeof PATHS }) {
  const f = useCurrentFrame() - at;
  const { fps } = useVideoConfig();
  const sfx = <Sfx at={at} src="whoosh" volume={0.8} />;
  const len = 3.4 * fps;
  if (f < 0 || f > len) return sfx;
  const band = good ? ['#15803d', '#22c55e'] : ['#b45309', '#f59e0b'];
  const x = interpolate(f, [0, 0.4 * fps, len - 0.45 * fps, len], [-110, 0, 0, 110], { ...clamp, easing: Easing.bezier(0.7, 0, 0.3, 1) });
  return (
    <AbsoluteFill style={{ zIndex: 80, display: 'grid', placeItems: 'center', overflow: 'hidden', fontFamily: FONT }}>
      {sfx}
      <AbsoluteFill style={{ background: 'rgba(20,26,46,.5)', opacity: ease(f, [0, 6, len - 10, len], [0, 1, 0.9, 0]) }} />
      <div style={{ width: '140%', padding: '56px 0 46px', transform: `translateX(${x}%) rotate(-3deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
        background: `repeating-linear-gradient(-45deg, rgba(255,255,255,.12) 0 26px, transparent 26px 52px), linear-gradient(90deg, ${band[0]}, ${band[1]} 30%, ${band[1]} 70%, ${band[0]})`,
        backgroundPositionX: `${f * 5}px, 0`, boxShadow: '0 0 0 6px rgba(255,255,255,.9), 0 40px 100px rgba(20,26,46,.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 44 }}>
          <div style={{ width: 170, height: 170, borderRadius: 40, background: '#fff', display: 'grid', placeItems: 'center', color: band[0], scale: ease(f, [6, 20], [0, 1], Easing.back(2)), rotate: `${ease(f, [6, 20], [-160, 0])}deg` }}><Icon n={icon} size={96} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 0.95 }}>
            <div style={{ font: `700 30px ${FONT}`, letterSpacing: '0.4em', color: 'rgba(255,255,255,.9)', textTransform: 'uppercase' }}>{kicker}</div>
            <div style={{ font: `800 150px/0.95 ${FONT}`, color: '#fff', letterSpacing: '-0.03em' }}>{name}</div>
            <div style={{ marginTop: 12, font: `800 66px/1 ${FONT}`, letterSpacing: '0.05em', textTransform: 'uppercase', color: band[0], background: '#fff', padding: '8px 26px', borderRadius: 16, scale: ease(f, [14, 26], [2.2, 1]), opacity: ease(f, [14, 20], [0, 1]) }}>{title}</div>
          </div>
        </div>
        <div style={{ font: `600 40px ${FONT}`, color: '#fff', opacity: ease(f, [20, 30], [0, 1]), maxWidth: 1500, textAlign: 'center' }}>{text}</div>
      </div>
    </AbsoluteFill>
  );
}

/** aviso escuro no topo, como os do jogo */
export function Toast({ at, text, len = 2.2 }: { at: number; text: string; len?: number }) {
  const f = useCurrentFrame() - at;
  const { fps } = useVideoConfig();
  if (f < 0 || f > len * fps) return null;
  return (
    <div style={{ position: 'absolute', left: '50%', top: 40, translate: `-50% ${ease(f, [0, 10], [-30, 0])}px`, opacity: ease(f, [0, 8, len * fps - 8, len * fps], [0, 1, 1, 0]), zIndex: 75,
      background: C.red, color: '#fff', font: `600 30px ${FONT}`, padding: '18px 34px', borderRadius: 18, boxShadow: SHADOW, whiteSpace: 'nowrap' }}>{text}</div>
  );
}

export const Center = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, color: C.ink, ...style }}>{children}</AbsoluteFill>
);

export const Title = ({ children, size = 96, style }: { children: ReactNode; size?: number; style?: CSSProperties }) => (
  <div style={{ font: `800 ${size}px/1.02 ${FONT}`, letterSpacing: '-0.035em', color: C.ink, textAlign: 'center', ...style }}>{children}</div>
);

export const lerp = (p: number, a: number, b: number) => a + (b - a) * p;
export { React };
