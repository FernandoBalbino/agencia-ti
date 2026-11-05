import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { AlertTriangle, CheckCircle2, Coffee, PackageCheck, Zap } from 'lucide-react';
import { serverNow, useFx } from './net.ts';
import { IMP, TEAM_COLORS } from '../shared/rules.ts';
import type { Fx, ImpKind, RoomView } from '../shared/types.ts';
import { sfx } from './sfx.ts';

export const teamColor = (i: number) => (i < 0 ? '#141a2e' : TEAM_COLORS[i % TEAM_COLORS.length]);
export const tc = (i: number) => ({ '--tc': teamColor(i) }) as CSSProperties;

export function Logo({ big }: { big?: boolean }) {
  return (
    <span className={`logo ${big ? 'big' : ''}`}>
      <svg viewBox="0 0 32 32" aria-hidden><rect x="3" y="3" width="11" height="11" rx="3.5" /><rect x="18" y="3" width="11" height="11" rx="3.5" className="soft" /><rect x="3" y="18" width="11" height="11" rx="3.5" className="soft" /><rect x="18" y="18" width="11" height="11" rx="3.5" /></svg>
      <span>Agência <b>TI</b></span>
    </span>
  );
}

export const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const HUES = ['#2F6BFF', '#7C5CFF', '#0EA5A0', '#F97316', '#E5487D', '#16A34A', '#D49A00', '#5B6B8C', '#0891B2', '#9333EA'];
const hue = (s: string) => HUES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
export function Face({ name, size = 30, off, title }: { name: string; size?: number; off?: boolean; title?: string }) {
  return (
    <span className={`face ${off ? 'off' : ''}`} title={title ?? name} style={{ width: size, height: size, fontSize: size * 0.4, '--h': hue(name) } as CSSProperties}>
      {initials(name)}
    </span>
  );
}

/** raios de energia: cheios = disponíveis */
export function Bolts({ n, max, size = 16 }: { n: number; max?: number; size?: number }) {
  const total = Math.max(max ?? n, n);
  return (
    <span className="bolts" aria-label={`${n} de energia`}>
      {Array.from({ length: Math.min(total, 8) }, (_, i) => <Zap key={i} size={size} className={i < n ? 'on' : ''} />)}
      {total > 8 && <small>{n}</small>}
    </span>
  );
}

export function useClock(ms = 250) {
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((x) => x + 1), ms); return () => clearInterval(i); }, [ms]);
  return serverNow();
}
export const leftOf = (room: RoomView | undefined, now: number) => (!room ? 0 : room.paused ? room.left : room.endsAt - now);
export const phaseLabel = (room: RoomView) =>
  room.phase === 'plan' ? 'Planejamento' : room.phase === 'day' ? `Dia ${room.day} de ${room.settings.days}` : room.phase === 'results' ? 'Resultado' : 'Sala de espera';

// ---------- avisos rápidos ----------
type Toast = { id: number; text: string; kind?: 'bad' | 'ok' | 'help' };
let toastId = 0;
const local = new Set<(t: Toast) => void>();
export const toast = (text: string, kind?: Toast['kind']) => local.forEach((f) => f({ id: ++toastId, text, kind }));

export function Toasts({ cardTitle }: { cardTitle?: (id: string) => string }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = (t: Toast) => {
    setList((l) => [...l.slice(-2), t]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 3600);
  };
  useEffect(() => { local.add(push); return () => { local.delete(push); }; }, []);
  useFx((f) => {
    if (f.t === 'toast') push({ id: ++toastId, text: f.text });
    if (f.t === 'help') { push({ id: ++toastId, text: `${f.name} pediu ajuda em “${cardTitle?.(f.card) ?? 'um cartão'}”`, kind: 'help' }); sfx.tap(); }
    if (f.t === 'kicked') push({ id: ++toastId, text: 'Você foi removido da sala', kind: 'bad' });
    if (f.t === 'closed') push({ id: ++toastId, text: 'O professor fechou a sala', kind: 'bad' });
  });
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => <div key={t.id} className={`toast ${t.kind ?? ''}`}>{t.text}</div>)}
    </div>
  );
}

// ---------- vinheta: imprevisto, pedido entregue ----------
type Vig = { id: number; kind: ImpKind | 'delivered'; name: string; color: number; text: string };
const ICON: Record<string, typeof Zap> = { delivered: PackageCheck, cafe: Coffee };
export function Vignette() {
  const [queue, setQueue] = useState<Vig[]>([]);
  useFx((f: Fx) => {
    if (f.t === 'imp') { setQueue((q) => [...q, { id: ++toastId, kind: f.kind, name: f.team === null ? f.name : `Equipe ${f.name}`, color: f.color, text: f.text }]); IMP[f.kind].good ? sfx.good() : sfx.imp(); }
    if (f.t === 'delivered') { setQueue((q) => [...q, { id: ++toastId, kind: 'delivered', name: `Equipe ${f.name}`, color: f.color, text: 'Pedido entregue! Agora é esperar as outras equipes.' }]); sfx.win(); }
  });
  const cur = queue[0];
  useEffect(() => {
    if (!cur) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 4200);
    return () => clearTimeout(t);
  }, [cur]);
  if (!cur) return null;
  const good = cur.kind === 'delivered' || IMP[cur.kind].good;
  const Icon = ICON[cur.kind] ?? AlertTriangle;
  return (
    <div className={`vig ${good ? 'good' : ''}`} key={cur.id} role="alert" style={tc(cur.color)}>
      <div className="vig-flash" />
      <div className="vig-band">
        <div className="vig-stripes" />
        <div className="vig-content">
          <span className="vig-icon"><Icon size={64} strokeWidth={2.2} /></span>
          <div className="vig-text">
            <span className="vig-kicker">{cur.kind === 'delivered' ? 'pedido concluído' : good ? 'boa notícia' : 'imprevisto'}</span>
            <span className="vig-name">{cur.name}</span>
            <span className="vig-title">{cur.kind === 'delivered' ? 'Entregue' : IMP[cur.kind].title}</span>
          </div>
        </div>
        <p className="vig-by">{cur.text}</p>
      </div>
    </div>
  );
}

/** aviso de novo dia (energia recarregada) */
export function DayBanner() {
  const [d, setD] = useState<{ id: number; day: number; days: number } | null>(null);
  useFx((f) => { if (f.t === 'day') { setD({ id: ++toastId, day: f.day, days: f.days }); sfx.day(); } });
  useEffect(() => { if (!d) return; const t = setTimeout(() => setD(null), 2400); return () => clearTimeout(t); }, [d]);
  if (!d) return null;
  return (
    <div className="daybanner" key={d.id} role="status">
      <div className="daycard">
        <span className="day-k">Dia</span>
        <b>{d.day}<small>/{d.days}</small></b>
        <span className="day-t"><Zap size={18} /> Energia recarregada</span>
      </div>
    </div>
  );
}

/** confete em canvas (leve para o Chromebook) */
export function Confetti({ fire }: { fire: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!fire || !cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = cv.getContext('2d')!, r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5);
    cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const P = Array.from({ length: 110 }, (_, i) => ({
      x: r.width * (0.3 + Math.random() * 0.4), y: r.height * 0.45, vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 13 - 5,
      s: 6 + Math.random() * 7, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.35, c: TEAM_COLORS[i % TEAM_COLORS.length],
    }));
    let n = 0, raf = 0;
    const frame = () => {
      ctx.clearRect(0, 0, r.width, r.height);
      for (const p of P) { p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }
      if (++n < 200) raf = requestAnimationFrame(frame); else ctx.clearRect(0, 0, r.width, r.height);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [fire]);
  return <canvas ref={ref} className="confetti" aria-hidden />;
}

export function Done({ size = 16 }: { size?: number }) { return <CheckCircle2 size={size} className="ok-ic" />; }

export function Booting() {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 4000); return () => clearTimeout(t); }, []);
  return (
    <main className="center-page">
      <div className="boot">
        <Logo big />
        <div className="loader" aria-hidden><i /><i /><i /></div>
        <p>Conectando ao servidor…</p>
        {slow && <p className="hint">O servidor gratuito pode levar até 1 minuto para acordar.</p>}
      </div>
    </main>
  );
}
