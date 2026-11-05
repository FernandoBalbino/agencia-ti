// Alunos-robô para testar localmente: entram na sala e jogam sozinhos.
//   node tests/bots.mjs CODIGO [quantidade] [servidor] [ms entre ações]
import { io } from 'socket.io-client';
import { clientById } from '../shared/clients.ts';
import { isOpen } from '../shared/rules.ts';

export const NAMES = ['Ana', 'Bruno', 'Carla', 'Davi', 'Enzo', 'Fabi', 'Gabi', 'Heitor', 'Iara', 'João', 'Kauã', 'Lara', 'Malu', 'Nina', 'Otto', 'Pedro', 'Rafa', 'Sofia', 'Theo', 'Vivi', 'Yuri', 'Zoe', 'Lia', 'Igor'];

export function bot(name, { code, server = 'http://localhost:3001', pace = 900, sloppy = 0.04 }) {
  const s = io(server, { transports: ['websocket'] });
  const st = { room: null, team: null, me: null, results: null };
  s.on('view', (v) => { for (const k of ['room', 'team', 'me', 'results']) if (k in v) st[k] = v[k]; });
  const call = (ev, d = {}) => new Promise((r) => s.emit(ev, d, r));
  const tick = async () => {
    const { room, team, me } = st;
    if (!room || !team || !me || room.paused || team.delivered) return;
    const c = clientById(room.clientId);
    const def = (id) => (id === c.bonus.id ? c.bonus : c.cards.find((d) => d.id === id));
    const rows = team.cards.map(([id, col, spent, owner, blocked]) => ({ id, col, spent, owner, blocked, def: def(id) }));
    const cells = Object.fromEntries(rows.map((r) => [r.id, { col: r.col, spent: r.spent }]));
    const my = team.members.find((m) => m.id === me.id);
    if (room.phase === 'plan' || room.phase === 'day') {
      const bank = rows.filter((r) => r.col === 'bank' && (!r.def.x || Math.random() < sloppy));
      if (bank.length && Math.random() < 0.6) return call('add', { id: bank[0].id });
    }
    if (room.phase !== 'day' || !my || my.energy <= 0) return;
    const mine = rows.find((r) => r.col === 'doing' && r.owner === me.id);
    if (mine && !mine.blocked) return call('spend', { id: mine.id });
    if (!mine) {
      const open = rows.filter((r) => r.col === 'todo' && !r.blocked && isOpen(r.def, cells));
      if (open.length) return call('take', { id: open[Math.floor(Math.random() * open.length)].id });
      const other = rows.find((r) => r.col === 'doing' && !r.blocked && r.owner !== me.id);
      if (other && Math.random() < 0.5) return call('spend', { id: other.id }); // ajuda um colega
    }
  };
  s.on('connect', async () => {
    const r = await call('join', { code, name });
    if (!r.ok) console.log(name, r.err);
    await call('fs', { on: true });
  });
  const loop = setInterval(tick, pace * (0.7 + Math.random() * 0.6));
  return { name, s, st, call, stop: () => { clearInterval(loop); s.close(); } };
}

if (process.argv[1]?.endsWith('bots.mjs')) {
  const [code, n = '8', server = 'http://localhost:3001', pace = '900'] = process.argv.slice(2);
  if (!code) { console.log('uso: node tests/bots.mjs CODIGO [quantidade] [servidor] [ms]'); process.exit(1); }
  const bots = NAMES.slice(0, Number(n)).map((nm) => bot(nm, { code, server, pace: Number(pace) }));
  console.log(`${bots.length} robôs entrando na sala ${code}…`);
  process.on('SIGINT', () => { bots.forEach((b) => b.stop()); process.exit(0); });
}
