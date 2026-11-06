// Regras da Agência TI. O servidor é a única fonte de verdade; o site só mostra.
import { CLIENTS, clientById } from '../shared/clients.ts';
import type { CardDef, Client } from '../shared/clients.ts';
import { DEFAULTS, IMP, LIMITS, PTS, TEAM_NAMES, balance, isOpen, splitEnergy } from '../shared/rules.ts';
import type {
  CardRow, Col, Delivered, Fx, ImpEvent, ImpKind, Phase, PlayerRow, RoundResult, Settings, TeamResult, TeamSummary, TeamView, View,
} from '../shared/types.ts';

// AG_SPEED acelera o relógio nos testes locais (ex.: AG_SPEED=20 → 1 minuto vira 3 s).
const SPEED = Number(process.env.AG_SPEED) || 1;
export const MIN = 60_000 / SPEED;
const MAX_PLAYERS = 60;
const KINDS = Object.keys(IMP) as ImpKind[];

export class Oops extends Error {}
export function fail(m: string): never { throw new Oops(m); }
const rnd = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: readonly T[]): T => a[rnd(a.length)];
const newId = () => Math.random().toString(36).slice(2, 10);

export type Send = (sid: string, ev: 'view' | 'fx', data: View | Fx) => void;
type Cell = { col: Col; spent: number; owner: string | null; blockedDay: number };
export type P = { id: string; token: string; name: string; sid: string | null; team: number | null; fs: boolean; help: boolean };
export type T = {
  id: number; name: string; color: number; members: string[]; cells: Map<string, Cell>;
  energy: Map<string, number>; absent: Set<string>; bonus: boolean;
  delivered: (Delivered & { sobra: number }) | null; events: ImpEvent[]; helps: number; acc: number;
};
type Section = 'room' | 'players' | 'teams' | 'results' | 'history';
const ALL: Section[] = ['room', 'players', 'teams', 'results', 'history'];

const freshCells = (c: Client) => new Map<string, Cell>(c.cards.map((d) => [d.id, { col: 'bank', spent: 0, owner: null, blockedDay: 0 }]));

// Texto do imprevisto igual para todas as equipes (o que aparece no telão).
const ALL_TEXT: Record<ImpKind, string> = {
  faltou: 'Uma pessoa de cada equipe faltou hoje e ficou sem energia.',
  queda: 'Cada integrante perdeu 1 ⚡ hoje.',
  extra: 'O cliente ligou pedindo mais uma coisa.',
  atraso: 'Uma peça atrasou: um cartão fica travado até amanhã.',
  travou: 'Um cartão pronto voltou para ser refeito.',
  cafe: 'O cliente trouxe café: +1 ⚡ para cada integrante hoje.',
};

export class Room {
  code: string;
  send: Send;
  profToken = crypto.randomUUID();
  profSid: string | null = null;
  players = new Map<string, P>();
  teams: T[] = [];
  phase: Phase = 'lobby';
  round = 0; day = 0; endsAt = 0; paused = false; left = 0;
  settings: Settings = { ...DEFAULTS };
  clientId = CLIENTS[0].id;
  next = 'random';
  results: RoundResult | null = null;
  history: RoundResult[] = [];
  used: string[] = [];
  revealed = false;
  lastAuto: ImpKind | null = null;
  lastActive = Date.now();
  finishing: ReturnType<typeof setTimeout> | null = null;
  dirty = new Set<Section>();
  dirtyTeams = new Set<number>();
  meDirty = new Set<string>();
  queued = false;

  constructor(code: string, send: Send) {
    this.code = code; this.send = send;
    this.teams = Array.from({ length: this.settings.teams }, (_, i) => this.newTeam(i)); // colunas vazias para montar à mão
  }
  newTeam(i: number): T {
    return { id: i, name: TEAM_NAMES[i], color: i, members: [], cells: freshCells(this.client), energy: new Map(), absent: new Set(), bonus: false, delivered: null, events: [], helps: 0, acc: 0 };
  }

  get client() { return clientById(this.clientId); }
  live() { return this.phase === 'plan' || this.phase === 'day'; }
  members(t: T) { return t.members.map((id) => this.players.get(id)).filter((p): p is P => !!p); }
  active() { return this.teams.filter((t) => t.members.length > 0); }
  need(t: T): CardDef[] { const c = this.client; return [...c.cards.filter((d) => !d.x), ...(t.bonus ? [c.bonus] : [])]; }
  def(id: string): CardDef | undefined { const c = this.client; return id === c.bonus.id ? c.bonus : c.cards.find((d) => d.id === id); }

  // ---------- entrada ----------
  join(rawName: string, sid: string): P {
    const name = rawName.replace(/\s+/g, ' ').trim().slice(0, 20);
    if (name.length < 2) fail('Digite seu nome');
    if (this.players.size >= MAX_PLAYERS) fail('A sala está cheia');
    const p: P = { id: newId(), token: crypto.randomUUID(), name, sid, team: null, fs: false, help: false };
    this.players.set(p.id, p);
    if (this.live()) this.enlist(p, this.smallest()); // chegou com a rodada andando: vai para a menor equipe
    this.touch('players');
    this.sendFull(p);
    return p;
  }
  attach(p: P, sid: string) { p.sid = sid; this.touch('players'); this.touchTeam(p.team); this.sendFull(p); }
  attachProf(sid: string) {
    this.profSid = sid;
    this.send(sid, 'view', { ...this.view(null, new Set(ALL), false, false), full: true });
  }
  detach(sid: string) {
    if (this.profSid === sid) this.profSid = null;
    for (const p of this.players.values()) if (p.sid === sid) { p.sid = null; p.fs = false; this.touch('players'); this.touchTeam(p.team); }
  }
  leave(p: P) { this.release(p); this.players.delete(p.id); this.touch('players'); }
  kick(id: string) {
    const p = this.players.get(id) ?? fail('Aluno não encontrado');
    if (p.sid) this.send(p.sid, 'fx', { t: 'kicked' });
    this.leave(p);
  }

  /** menor equipe que já tem gente (não cria equipe de uma pessoa só) */
  smallest() {
    const list = this.active().length ? this.active() : this.teams;
    return list.reduce((a, b) => (b.members.length < a.members.length ? b : a)).id;
  }
  /** tira o aluno da equipe atual; o cartão que ele fazia volta para "A fazer" com a energia já gasta */
  release(p: P) {
    const t = p.team === null ? null : this.teams[p.team];
    if (!t) return;
    for (const c of t.cells.values()) if (c.owner === p.id && c.col === 'doing') { c.col = 'todo'; c.owner = null; }
    t.members = t.members.filter((id) => id !== p.id);
    t.energy.delete(p.id); t.absent.delete(p.id);
    p.team = null; p.help = false;
    this.touchTeam(t.id); this.meDirty.add(p.id);
  }
  enlist(p: P, ti: number) {
    this.release(p);
    const t = this.teams[ti] ?? fail('Equipe não encontrada');
    t.members.push(p.id);
    if (this.phase === 'day') t.energy.set(p.id, 0); // entrou no meio do dia: energia só amanhã
    p.team = ti;
    this.touchTeam(ti); this.meDirty.add(p.id); this.touch('players');
  }

  // ---------- professor ----------
  setSettings(a: Record<string, unknown>) {
    const s = { ...this.settings };
    if (!this.live()) {
      for (const k of ['teams', 'days', 'dayMin', 'planMin', 'energy'] as const) {
        const v = Number(a[k]);
        if (a[k] === undefined || !Number.isFinite(v)) continue;
        const [lo, hi] = LIMITS[k];
        s[k] = Math.min(hi, Math.max(lo, k === 'dayMin' ? Math.round(v * 2) / 2 : Math.round(v)));
      }
    }
    if (typeof a.autoImp === 'boolean') s.autoImp = a.autoImp;
    if (typeof a.next === 'string') this.next = a.next === 'random' || CLIENTS.some((c) => c.id === a.next) ? a.next : 'random';
    const resize = s.teams !== this.settings.teams;
    this.settings = s;
    if (resize) this.resizeTeams(s.teams);
    this.touch('room');
  }
  /** muda o número de colunas; quem estava numa equipe que sumiu volta para "sem equipe" */
  resizeTeams(n: number) {
    while (this.teams.length < n) this.teams.push(this.newTeam(this.teams.length));
    while (this.teams.length > n) {
      const t = this.teams.pop()!;
      for (const id of t.members) { const p = this.players.get(id); if (p) { p.team = null; p.help = false; this.meDirty.add(p.id); } }
    }
    this.teams.forEach((t) => this.dirtyTeams.add(t.id));
    this.touch('players', 'teams');
  }
  /** todos voltam para "sem equipe" e os pontos acumulados zeram */
  clearTeams() {
    if (this.live()) fail('Mude as equipes entre as rodadas');
    this.teams = this.teams.map((_, i) => this.newTeam(i));
    for (const p of this.players.values()) { p.team = null; p.help = false; this.meDirty.add(p.id); }
    this.touch('players', 'teams');
  }
  sortTeams() {
    if (this.live()) fail('Sorteie as equipes entre as rodadas');
    const ps = [...this.players.values()];
    if (ps.length < 2) fail('Espere pelo menos 2 alunos entrarem');
    const groups = balance(ps, this.settings.teams);
    this.teams = groups.map((g, i) => ({ ...this.newTeam(i), members: g.map((p) => p.id) }));
    groups.forEach((g, i) => g.forEach((p) => { p.team = i; p.help = false; this.meDirty.add(p.id); }));
    this.teams.forEach((t) => this.dirtyTeams.add(t.id));
    this.touch('players', 'teams');
  }
  /** professor arrasta (ou clica) alunos para uma equipe; -1 = sem equipe */
  move(ids: string[], ti: number) {
    if (ti !== -1 && (!Number.isInteger(ti) || !this.teams[ti])) fail('Equipe não encontrada');
    if (ti === -1 && this.live()) fail('Durante a rodada, troque o aluno de equipe');
    for (const id of ids.slice(0, MAX_PLAYERS)) {
      const p = this.players.get(id);
      if (!p || p.team === ti) continue;
      if (ti === -1) { this.release(p); this.touch('players'); } else this.enlist(p, ti);
    }
  }

  start() {
    if (this.live()) fail('A rodada já começou');
    // quem ficou sem equipe vai para as menores, para ninguém ficar de fora
    for (const p of this.players.values()) if (p.team === null && this.active().length) this.enlist(p, this.smallest());
    if (!this.active().length) fail('Coloque os alunos nas equipes primeiro');
    const pool = CLIENTS.filter((c) => !this.used.includes(c.id));
    const c = this.next !== 'random' ? clientById(this.next) : pick(pool.length ? pool : CLIENTS);
    this.clientId = c.id; this.used.push(c.id); this.next = 'random';
    this.round++; this.day = 0; this.results = null; this.revealed = false; this.lastAuto = null;
    for (const t of this.teams) {
      t.cells = freshCells(c); t.bonus = false; t.delivered = null; t.events = []; t.helps = 0;
      t.energy.clear(); t.absent.clear(); this.dirtyTeams.add(t.id);
    }
    for (const p of this.players.values()) p.help = false;
    this.phase = 'plan'; this.paused = false;
    this.endsAt = Date.now() + this.settings.planMin * MIN;
    this.touch('room', 'teams', 'results');
  }
  startDay(d: number) {
    this.phase = 'day'; this.day = d;
    this.endsAt = Date.now() + this.settings.dayMin * MIN;
    for (const t of this.teams) {
      const ms = this.members(t), split = splitEnergy(this.settings.energy, ms.length);
      t.energy.clear(); t.absent.clear();
      ms.forEach((p, i) => t.energy.set(p.id, split[(i + d) % ms.length])); // o +1 roda entre os integrantes
      this.dirtyTeams.add(t.id);
    }
    this.touch('room', 'teams');
    this.broadcast({ t: 'day', day: d, days: this.settings.days });
    if (d >= 2 && this.settings.autoImp) {
      const ok = KINDS.filter((k) => k !== this.lastAuto && !(k === 'extra' && this.teams.some((t) => t.bonus)));
      const k = pick(ok);
      this.lastAuto = k;
      setTimeout(() => this.impMany(this.open(), k, true), 2600); // depois do aviso do novo dia
    }
  }
  pause() {
    if (!this.live()) fail('Não há rodada em andamento');
    const now = Date.now();
    if (this.paused) { this.endsAt = now + this.left; this.paused = false; }
    else { this.left = Math.max(0, this.endsAt - now); this.paused = true; }
    this.touch('room');
  }
  addTime() {
    if (!this.live()) fail('Não há rodada em andamento');
    if (this.paused) this.left += MIN; else this.endsAt += MIN;
    this.touch('room');
  }
  skip() {
    if (!this.live()) fail('Não há rodada em andamento');
    this.paused = false; this.endsAt = Date.now();
    this.tick(Date.now());
  }
  /** equipes que ainda não entregaram */
  open() { return this.active().filter((t) => !t.delivered); }
  profImp(target: unknown, kind: unknown) {
    if (this.phase !== 'day' || this.paused) fail('Imprevistos só durante os dias, sem pausa');
    const list = this.open();
    if (!list.length) fail('Todas as equipes já entregaram');
    const k = KINDS.includes(kind as ImpKind) ? (kind as ImpKind) : pick(KINDS);
    if (target === 'all') return this.impMany(list, k, false);
    const t = target === 'leader' ? this.leader(list) : target === 'random' ? pick(list) : list.find((x) => x.id === Number(target));
    if (!t) fail('Essa equipe já entregou ou não existe');
    this.impOne(t, k);
  }
  leader(list: T[]) {
    const prog = (t: T) => { const n = this.need(t); return n.filter((d) => t.cells.get(d.id)?.col === 'done').length / n.length; };
    return [...list].sort((a, b) => prog(b) - prog(a))[0];
  }
  impOne(t: T, k: ImpKind) {
    const ev = this.applyImp(t, k);
    const fx: Fx = { t: 'imp', team: t.id, name: t.name, color: t.color, kind: ev.kind, text: ev.text };
    this.toTeam(t, fx);
    if (this.profSid) this.send(this.profSid, 'fx', fx);
  }
  impMany(list: T[], k: ImpKind, auto: boolean) {
    if (this.phase !== 'day' || !list.length) return;
    for (const t of list) {
      const ev = this.applyImp(t, k);
      this.toTeam(t, { t: 'imp', team: t.id, name: t.name, color: t.color, kind: ev.kind, text: ev.text });
    }
    if (this.profSid) this.send(this.profSid, 'fx', { t: 'imp', team: null, name: auto ? `Dia ${this.day}: todas as equipes` : 'Todas as equipes', color: -1, kind: k, text: ALL_TEXT[k] });
  }
  /** aplica o efeito; se não der (ex.: nenhum cartão pronto), vira queda de energia */
  applyImp(t: T, kind: ImpKind): ImpEvent {
    const c = this.client, ms = this.members(t);
    let text = '';
    const board = [...t.cells].filter(([id]) => !this.def(id)?.x);
    switch (kind) {
      case 'faltou': {
        const cand = ms.filter((p) => !t.absent.has(p.id) && (t.energy.get(p.id) ?? 0) > 0);
        if (!cand.length || ms.length < 2) return this.applyImp(t, 'queda');
        const p = pick(cand);
        t.absent.add(p.id); t.energy.set(p.id, 0);
        text = `${p.name} faltou hoje e ficou sem energia. A equipe precisa cobrir o trabalho.`;
        break;
      }
      case 'queda':
        for (const p of ms) t.energy.set(p.id, Math.max(0, (t.energy.get(p.id) ?? 0) - 1));
        text = 'Queda de energia: cada integrante perdeu 1 ⚡ hoje.';
        break;
      case 'extra':
        if (t.bonus) return this.applyImp(t, 'queda');
        t.bonus = true;
        t.cells.set(c.bonus.id, { col: 'todo', spent: 0, owner: null, blockedDay: 0 });
        text = `${c.nick} ligou: quer também “${c.bonus.t}”. O cartão já está em A fazer.`;
        break;
      case 'atraso': {
        const cand = board.filter(([, x]) => (x.col === 'todo' || x.col === 'doing') && x.blockedDay !== this.day);
        if (!cand.length) return this.applyImp(t, 'queda');
        const [id, x] = pick(cand);
        x.blockedDay = this.day;
        text = `A peça de “${this.def(id)?.t}” atrasou. O cartão fica travado até amanhã.`;
        break;
      }
      case 'travou': {
        const cand = board.filter(([id, x]) => x.col === 'done' && (this.def(id)?.c ?? 0) >= 1);
        if (!cand.length) return this.applyImp(t, 'queda');
        const [id, x] = pick(cand);
        const d = this.def(id)!;
        // quem tinha feito pode estar com outro cartão: volta para "A fazer", faltando 1 ⚡
        x.col = 'todo'; x.spent = d.c - 1; x.owner = null;
        text = `O computador travou: “${d.t}” voltou para A fazer e falta 1 ⚡.`;
        break;
      }
      case 'cafe':
        for (const p of ms) if (!t.absent.has(p.id)) t.energy.set(p.id, (t.energy.get(p.id) ?? 0) + 1);
        text = `${c.nick} trouxe café: +1 ⚡ para cada integrante hoje.`;
        break;
    }
    const ev = { day: this.day, kind, text };
    t.events.push(ev);
    this.touchTeam(t.id);
    return ev;
  }

  tick(now: number) {
    if (!this.live() || this.paused || now < this.endsAt) return;
    if (this.phase === 'plan') this.startDay(1);
    else if (this.day < this.settings.days) this.startDay(this.day + 1);
    else this.finish();
  }

  finish() {
    if (!this.live()) return;
    if (this.finishing) { clearTimeout(this.finishing); this.finishing = null; }
    const c = this.client;
    const key = (r: TeamResult) => (r.delivered ? r.delivered.day * 1e9 + r.delivered.ms : Infinity);
    const teams = this.active().map((t): TeamResult => {
      const need = this.need(t), done = need.filter((d) => t.cells.get(d.id)?.col === 'done');
      const extras = c.cards.filter((d) => d.x && t.cells.get(d.id)?.col !== 'bank').map((d) => d.id);
      const parts = {
        cards: done.length * PTS.card,
        prazo: t.delivered ? PTS.prazo : 0,
        sobra: t.delivered ? t.delivered.sobra * PTS.sobra : 0,
        fora: -extras.length * PTS.fora,
      };
      const pts = parts.cards + parts.prazo + parts.sobra + parts.fora;
      t.acc += pts;
      return {
        id: t.id, name: t.name, color: t.color, members: this.members(t).map((p) => p.name),
        pts, parts, done: done.length, total: need.length,
        delivered: t.delivered && { day: t.delivered.day, ms: t.delivered.ms },
        missing: need.filter((d) => t.cells.get(d.id)?.col !== 'done').map((d) => d.id),
        extras, events: t.events, helps: t.helps, acc: t.acc,
      };
    }).sort((a, b) => b.pts - a.pts || key(a) - key(b) || b.done - a.done);
    this.results = { round: this.round, clientId: c.id, at: Date.now(), code: this.code, days: this.settings.days, teams };
    this.history = [...this.history, this.results].slice(-20);
    this.phase = 'results'; this.paused = false; this.revealed = false;
    for (const p of this.players.values()) p.help = false;
    this.touch('room', 'results', 'history', 'teams');
  }
  reveal() { if (this.phase === 'results') { this.revealed = true; this.touch('room'); } }
  toLobby() { if (this.live()) fail('Encerre a rodada antes'); this.phase = 'lobby'; this.touch('room'); }

  // ---------- alunos ----------
  teamOf(p: P): T { return (p.team !== null && this.teams[p.team]) || fail('Você ainda não está em uma equipe'); }
  cell(t: T, id: string) {
    const d = this.def(id), c = t.cells.get(id);
    if (!d || !c) fail('Cartão não encontrado');
    return { d, c };
  }
  working() { if (this.paused) fail('O jogo está pausado'); }
  add(p: P, id: string) {
    if (!this.live()) fail('A rodada não começou');
    const t = this.teamOf(p), { c } = this.cell(t, id);
    if (c.col !== 'bank') fail('Esse cartão já está no quadro');
    c.col = 'todo';
    this.touchTeam(t.id);
  }
  remove(p: P, id: string) {
    if (!this.live()) fail('A rodada não começou');
    const t = this.teamOf(p), { c } = this.cell(t, id);
    if (id === this.client.bonus.id) fail('Esse é um pedido do cliente');
    if (c.col !== 'todo' || c.spent > 0) fail('Só dá para devolver cartão que ninguém começou');
    c.col = 'bank';
    this.touchTeam(t.id);
  }
  take(p: P, id: string) {
    if (this.phase !== 'day') fail('Os cartões começam no dia 1. Agora é hora de planejar!');
    this.working();
    const t = this.teamOf(p), { d, c } = this.cell(t, id);
    if (c.col !== 'todo') fail('Esse cartão não está em A fazer');
    if (!isOpen(d, t.cells)) fail('Esse cartão espera outro ficar pronto');
    if (c.blockedDay === this.day) fail('A peça atrasou: esse cartão volta amanhã');
    if ([...t.cells.values()].some((x) => x.col === 'doing' && x.owner === p.id)) fail('Termine o seu cartão antes de pegar outro');
    c.col = 'doing'; c.owner = p.id;
    this.touchTeam(t.id);
  }
  spend(p: P, id: string) {
    if (this.phase !== 'day') fail('A energia começa no dia 1');
    this.working();
    const t = this.teamOf(p), { d, c } = this.cell(t, id);
    if (c.col !== 'doing') fail('Pegue o cartão antes de gastar energia');
    if (c.blockedDay === this.day) fail('A peça atrasou: esse cartão volta amanhã');
    const e = t.energy.get(p.id) ?? 0;
    if (e <= 0) fail(t.absent.has(p.id) ? 'Você faltou hoje: converse com a equipe' : 'Sua energia acabou hoje');
    t.energy.set(p.id, e - 1);
    c.spent++;
    if (c.owner !== p.id) t.helps++;
    let done = false;
    if (c.spent >= d.c) {
      c.col = 'done'; done = true;
      const owner = c.owner ? this.players.get(c.owner) : null;
      if (owner) owner.help = false;
    }
    this.touchTeam(t.id);
    if (done) this.checkDelivered(t);
    return { done };
  }
  /** devolve um cartão de "Fazendo" para "A fazer" (a energia gasta fica); o dono ou, se ele saiu/faltou, um colega */
  drop(p: P, id: string) {
    if (!this.live()) fail('A rodada não começou');
    this.working();
    const t = this.teamOf(p), { c } = this.cell(t, id);
    if (c.col !== 'doing') fail('Esse cartão não está em Fazendo');
    const owner = c.owner ? this.players.get(c.owner) : null;
    if (c.owner !== p.id && owner?.sid && !t.absent.has(owner.id)) fail(`Esse cartão é de ${owner.name}. Peça para ${owner.name} devolver ou ajude com energia.`);
    if (owner) owner.help = false;
    c.col = 'todo'; c.owner = null;
    this.touchTeam(t.id);
  }
  help(p: P) {
    const t = this.teamOf(p);
    const mine = [...t.cells].find(([, x]) => x.col === 'doing' && x.owner === p.id);
    if (!mine) fail('Pegue um cartão para pedir ajuda nele');
    p.help = !p.help;
    if (p.help) this.toTeam(t, { t: 'help', name: p.name, card: mine[0] }, p.id);
    this.touchTeam(t.id);
    return { help: p.help };
  }
  setFs(p: P, on: boolean) { if (p.fs !== on) { p.fs = on; this.touch('players'); } }

  checkDelivered(t: T) {
    if (t.delivered || this.phase !== 'day') return;
    if (!this.need(t).every((d) => t.cells.get(d.id)?.col === 'done')) return;
    const dayLen = this.settings.dayMin * MIN;
    // tempo do dia em que entregou, na escala real (sem a aceleração dos testes)
    const ms = Math.round(Math.min(dayLen, Math.max(0, dayLen - (this.endsAt - Date.now()))) * SPEED);
    const sobra = [...t.energy.values()].reduce((a, b) => a + b, 0) + (this.settings.days - this.day) * this.settings.energy;
    t.delivered = { day: this.day, ms, sobra };
    const fx: Fx = { t: 'delivered', team: t.id, name: t.name, color: t.color };
    this.toTeam(t, fx);
    if (this.profSid) this.send(this.profSid, 'fx', fx);
    this.touch('teams');
    if (!this.open().length && !this.finishing) this.finishing = setTimeout(() => { this.finishing = null; this.finish(); }, 3500);
  }

  // ---------- envio (agrupa mudanças e manda só o que mudou) ----------
  toTeam(t: T, fx: Fx, except?: string) {
    for (const p of this.members(t)) if (p.sid && p.id !== except) this.send(p.sid, 'fx', fx);
  }
  broadcast(fx: Fx) {
    for (const p of this.players.values()) if (p.sid) this.send(p.sid, 'fx', fx);
    if (this.profSid) this.send(this.profSid, 'fx', fx);
  }
  touch(...s: Section[]) { for (const x of s) this.dirty.add(x); this.queue(); }
  touchTeam(ti: number | null) { if (ti !== null) { this.dirtyTeams.add(ti); this.touch('teams'); } }
  queue() {
    this.lastActive = Date.now();
    if (this.queued) return;
    this.queued = true;
    setTimeout(() => this.flush(), 80);
  }
  flush() {
    this.queued = false;
    for (const p of this.players.values()) {
      if (!p.sid) continue;
      const td = p.team !== null && this.dirtyTeams.has(p.team);
      const v = this.view(p, this.dirty, td, this.meDirty.has(p.id));
      if (Object.keys(v).length > 1) this.send(p.sid, 'view', v);
    }
    if (this.profSid) {
      const v = this.view(null, this.dirty, false, false);
      if (Object.keys(v).length > 1) this.send(this.profSid, 'view', v);
    }
    this.dirty.clear(); this.dirtyTeams.clear(); this.meDirty.clear();
  }
  sendFull(p: P) { if (p.sid) this.send(p.sid, 'view', { ...this.view(p, new Set(ALL), true, true), full: true }); }

  view(p: P | null, s: Set<Section>, teamDirty: boolean, me: boolean): View {
    const v: View = { now: Date.now() };
    if (s.has('room')) {
      v.room = {
        code: this.code, phase: this.phase, round: this.round, day: this.day, endsAt: this.endsAt, paused: this.paused, left: this.left,
        clientId: this.clientId, next: this.next, settings: this.settings, revealed: this.revealed,
      };
    }
    if (s.has('results')) v.results = this.results;
    if (p === null) {
      if (s.has('players')) v.players = [...this.players.values()].map((x): PlayerRow => ({ id: x.id, name: x.name, team: x.team, on: !!x.sid, fs: x.fs }));
      if (s.has('teams')) v.teams = this.teams.map((t) => this.summary(t));
      if (s.has('history')) v.history = this.history;
    } else {
      if (me) v.me = { id: p.id, team: p.team };
      if (teamDirty || me) v.team = p.team === null ? null : this.teamView(this.teams[p.team]);
    }
    return v;
  }
  teamView(t: T): TeamView {
    const blocked = (c: Cell) => (this.phase === 'day' && c.blockedDay === this.day ? 1 : 0);
    return {
      id: t.id, name: t.name, color: t.color, bonus: t.bonus, delivered: t.delivered && { day: t.delivered.day, ms: t.delivered.ms },
      members: this.members(t).map((m) => ({ id: m.id, name: m.name, on: !!m.sid, energy: t.energy.get(m.id) ?? 0, absent: t.absent.has(m.id), help: m.help })),
      cards: [...t.cells].map(([id, c]): CardRow => [id, c.col, c.spent, c.owner, blocked(c)]),
    };
  }
  summary(t: T): TeamSummary {
    const n = this.need(t), col = (k: Col) => n.filter((d) => t.cells.get(d.id)?.col === k).length;
    return {
      id: t.id, name: t.name, color: t.color, members: this.members(t).map((m) => ({ id: m.id, name: m.name, on: !!m.sid })),
      todo: col('todo'), doing: col('doing'), done: col('done'), total: n.length,
      energy: [...t.energy.values()].reduce((a, b) => a + b, 0), delivered: t.delivered && { day: t.delivered.day, ms: t.delivered.ms },
      events: t.events.length, total2: t.acc,
    };
  }
}

// ---------- salas ----------
export const rooms = new Map<string, Room>();
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createRoom(send: Send): Room {
  if (rooms.size >= 100) fail('Servidor lotado, tente mais tarde');
  let code = '';
  do code = Array.from({ length: 4 }, () => ABC[rnd(ABC.length)]).join(''); while (rooms.has(code));
  const r = new Room(code, send);
  rooms.set(code, r);
  return r;
}

export function closeRoom(r: Room) {
  if (r.finishing) clearTimeout(r.finishing);
  r.broadcast({ t: 'closed' });
  rooms.delete(r.code);
}
