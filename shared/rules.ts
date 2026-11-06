// Regras puras, usadas pelo servidor, pelo site e pelos testes.
import type { CardDef } from './clients.ts';
import type { Col, ImpKind, Settings } from './types.ts';

export const TEAM_NAMES = ['Pixel', 'Byte', 'Cache', 'Kernel', 'Cookie', 'Nuvem', 'Ping', 'Bit'];
export const TEAM_COLORS = ['#2F6BFF', '#7C5CFF', '#0EA5A0', '#F97316', '#E5487D', '#16A34A', '#D49A00', '#5B6B8C'];
export const PTS = { card: 10, prazo: 20, sobra: 2, fora: 5 };
export const DEFAULTS: Settings = { teams: 4, days: 3, dayMin: 3, planMin: 2, energy: 8, autoImp: true };
export const LIMITS = {
  teams: [2, 8], days: [2, 5], dayMin: [1, 6], planMin: [1, 4], energy: [4, 16],
} as const;

/** divide a energia da equipe entre os integrantes (diferença de no máximo 1) */
export function splitEnergy(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n), extra = total % n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

/** sorteia em k equipes equilibradas: tamanhos diferem em no máximo 1 */
export function balance<T>(items: T[], k: number, rnd = Math.random): T[][] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  const out: T[][] = Array.from({ length: k }, () => []);
  a.forEach((x, i) => out[i % k].push(x));
  return out;
}

/** embaralha sempre igual para a mesma semente: cada equipe vê uma ordem própria, que não muda a cada clique */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export type Cell = { col: Col; spent: number };
/** cartão liberado = todos os cartões de que ele depende estão prontos */
export const isOpen = (def: CardDef, cells: Map<string, Cell> | Record<string, Cell>) =>
  !(def.deps ?? []).some((d) => (cells instanceof Map ? cells.get(d) : cells[d])?.col !== 'done');

export const IMP: Record<ImpKind, { title: string; good?: boolean }> = {
  faltou: { title: 'Integrante faltou' },
  queda: { title: 'Queda de energia' },
  extra: { title: 'Pedido extra' },
  atraso: { title: 'Peça atrasada' },
  travou: { title: 'O computador travou' },
  cafe: { title: 'Café da cliente', good: true },
};

export const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
