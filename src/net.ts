import { io } from 'socket.io-client';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { Fx, RoundResult, View } from '../shared/types.ts';

export const SERVER = import.meta.env.VITE_SERVER_URL || `${location.protocol}//${location.hostname}:3001`;
// Só WebSocket (sem "polling"): menos requisições e menos banda no Render.
export const socket = io(SERVER, { transports: ['websocket'] });

type Sess = { code: string; token: string; prof?: boolean };
const KEY = 'agencia-ti-session';
const load = (): Sess | null => { try { return JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; } };
const save = (s: Sess) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* aba anônima */ } };
const clear = () => { try { localStorage.removeItem(KEY); } catch { /* idem */ } };

export type St = View & { conn: boolean; ready: boolean; offset: number; prof: boolean };
let st: St = { now: 0, conn: false, ready: false, offset: 0, prof: false };
const blank = (): St => ({ now: 0, conn: socket.connected, ready: st.ready, offset: st.offset, prof: false });
const subs = new Set<() => void>();
const set = (next: St) => { st = next; subs.forEach((f) => f()); };

export type Ack = { ok: boolean; err?: string; [k: string]: unknown };
export const call = (ev: string, data: object = {}): Promise<Ack> =>
  new Promise((res) => socket.timeout(10_000).emit(ev, data, (err: unknown, r: Ack) => res(err ? { ok: false, err: 'Sem resposta do servidor' } : r)));

socket.on('connect', async () => {
  set({ ...st, conn: true });
  const s = load();
  if (s) {
    const r = await call(s.prof ? 'prof:resume' : 'resume', s);
    if (!r.ok) { clear(); set({ ...blank(), conn: true }); }
    else set({ ...st, prof: !!s.prof });
  }
  set({ ...st, ready: true });
});
socket.on('disconnect', () => set({ ...st, conn: false }));
socket.on('view', (v: View) => {
  const base = v.full ? { ...blank(), conn: st.conn, ready: st.ready, prof: st.prof } : st;
  set({ ...base, ...v, offset: v.now - Date.now() });
  if (v.results && st.prof) keepResult(v.results);
});

const fxSubs = new Set<(f: Fx) => void>();
socket.on('fx', (f: Fx) => {
  if (f.t === 'kicked' || f.t === 'closed') { clear(); set({ ...blank(), conn: true, ready: true }); }
  fxSubs.forEach((cb) => cb(f));
});

export function useView(): St {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => st);
}

export function useFx(cb: (f: Fx) => void) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    const f = (x: Fx) => ref.current(x);
    fxSubs.add(f);
    return () => { fxSubs.delete(f); };
  }, []);
}

export const serverNow = () => Date.now() + st.offset;

export async function createRoom() {
  const r = await call('prof:create');
  if (r.ok) { save({ code: String(r.code), token: String(r.token), prof: true }); set({ ...st, prof: true }); }
  return r;
}

export async function joinRoom(code: string, name: string) {
  const r = await call('join', { code, name });
  if (r.ok) save({ code: code.trim().toUpperCase(), token: String(r.token) });
  return r;
}

export async function leaveRoom(prof = false) {
  await call(prof ? 'prof:close' : 'leave');
  clear();
  set({ ...blank(), conn: true, ready: true });
}

// Histórico do professor fica também no navegador (o servidor gratuito apaga tudo ao reiniciar).
const HKEY = 'agencia-ti-history';
export const loadHistory = (): RoundResult[] => { try { return JSON.parse(localStorage.getItem(HKEY) ?? '[]'); } catch { return []; } };
function keepResult(r: RoundResult) {
  const h = loadHistory().filter((x) => !(x.code === r.code && x.round === r.round));
  try { localStorage.setItem(HKEY, JSON.stringify([r, ...h].slice(0, 30))); } catch { /* cheio */ }
}
