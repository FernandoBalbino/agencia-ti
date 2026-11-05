// Tipos compartilhados entre servidor e site. Tudo pequeno de propósito: o Render tem limite de banda.
export type Phase = 'lobby' | 'plan' | 'day' | 'results';
export type Col = 'bank' | 'todo' | 'doing' | 'done';
export type ImpKind = 'faltou' | 'queda' | 'extra' | 'atraso' | 'travou' | 'cafe';

export type Settings = {
  teams: number;   // quantas equipes no sorteio
  days: number;    // dias por rodada
  dayMin: number;  // minutos de cada dia
  planMin: number; // minutos de planejamento
  energy: number;  // ⚡ da equipe por dia (dividida entre os integrantes)
  autoImp: boolean; // um imprevisto igual para todas as equipes a partir do dia 2
};

// [id do cartão, coluna, energia gasta, dono, travado hoje (1/0)]
export type CardRow = [id: string, col: Col, spent: number, owner: string | null, blocked: 0 | 1];
export type Member = { id: string; name: string; on: boolean; energy: number; absent: boolean; help: boolean };
export type Delivered = { day: number; ms: number };

export type TeamView = {
  id: number; name: string; color: number; members: Member[]; cards: CardRow[];
  bonus: boolean; delivered: Delivered | null;
};

export type TeamSummary = {
  id: number; name: string; color: number; members: { id: string; name: string; on: boolean }[];
  todo: number; doing: number; done: number; total: number; energy: number;
  delivered: Delivered | null; events: number; total2: number; // total2 = pontos acumulados
};

export type RoomView = {
  code: string; phase: Phase; round: number; day: number; endsAt: number; paused: boolean; left: number;
  clientId: string; next: string; settings: Settings; revealed: boolean;
};

export type PlayerRow = { id: string; name: string; team: number | null; on: boolean; fs: boolean };
export type ImpEvent = { day: number; kind: ImpKind; text: string };

export type TeamResult = {
  id: number; name: string; color: number; members: string[];
  pts: number; parts: { cards: number; prazo: number; sobra: number; fora: number };
  done: number; total: number; delivered: Delivered | null;
  missing: string[]; extras: string[]; events: ImpEvent[]; helps: number; acc: number;
};
export type RoundResult = { round: number; clientId: string; at: number; code: string; days: number; teams: TeamResult[] };

export type View = {
  now: number; full?: boolean;
  room?: RoomView;
  me?: { id: string; team: number | null };
  team?: TeamView | null;      // aluno: só a própria equipe
  players?: PlayerRow[];       // professor
  teams?: TeamSummary[];       // professor (telão)
  results?: RoundResult | null;
  history?: RoundResult[];     // professor
};

export type Fx =
  | { t: 'imp'; team: number | null; name: string; color: number; kind: ImpKind; text: string }
  | { t: 'delivered'; team: number; name: string; color: number }
  | { t: 'day'; day: number; days: number }
  | { t: 'help'; name: string; card: string }
  | { t: 'toast'; text: string }
  | { t: 'kicked' } | { t: 'closed' };
