import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { Oops, closeRoom, createRoom, fail, rooms } from './game.ts';
import type { Room } from './game.ts';

const PORT = Number(process.env.PORT) || 3001;
const origins = process.env.CLIENT_ORIGIN?.split(',').map((s) => s.trim());

// O site, o vídeo e os slides ficam no GitHub Pages; aqui só passa o tráfego do jogo (pouca banda).
const http = createServer((req, res) => {
  const ok = req.url === '/healthz';
  res.writeHead(ok ? 200 : 404, { 'content-type': 'text/plain', 'access-control-allow-origin': '*', 'cache-control': 'no-store' }).end(ok ? 'ok' : '');
});
const io = new Server(http, {
  cors: { origin: origins ?? true },
  serveClient: false,
  transports: ['websocket'], // sem "polling": menos requisições e menos banda
  perMessageDeflate: { threshold: 512 },
  maxHttpBufferSize: 8_000,
  pingInterval: 25_000,
});
const send = (sid: string, ev: string, data: unknown) => { io.to(sid).emit(ev, data); };

type Ack = (r: unknown) => void;
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const getRoom = (code: unknown) => rooms.get(str(code).trim().toUpperCase()) ?? fail('Sala não encontrada');

io.on('connection', (socket) => {
  let room: Room | null = null, pid: string | null = null, prof = false;
  let tokens = 12, last = Date.now();

  const leave = () => { room?.detach(socket.id); room = null; pid = null; prof = false; };
  const player = () => {
    const p = room && pid ? room.players.get(pid) : undefined;
    if (!room || !p) fail('Você não está em uma sala');
    return { r: room as Room, p };
  };
  const teacher = () => (room && prof ? room : fail('Somente o professor'));

  const on = (ev: string, fn: (a: Record<string, unknown>) => unknown) => socket.on(ev, (a: unknown, ack?: Ack) => {
    const reply: Ack = typeof ack === 'function' ? ack : () => {};
    const now = Date.now();
    tokens = Math.min(12, tokens + (now - last) / 150); last = now;
    if (tokens < 1) return reply({ ok: false, err: 'Calma! Muitos cliques seguidos.' });
    tokens--;
    try {
      const r = fn(a && typeof a === 'object' ? (a as Record<string, unknown>) : {});
      reply({ ok: true, ...(r && typeof r === 'object' ? r : {}) });
    } catch (e) {
      if (!(e instanceof Oops)) console.error(ev, e);
      reply({ ok: false, err: e instanceof Oops ? e.message : 'Erro no servidor' });
    }
  });

  // professor
  on('prof:create', () => {
    leave();
    const r = createRoom(send);
    room = r; prof = true;
    r.attachProf(socket.id);
    console.log(`sala ${r.code} criada (${rooms.size} ativas)`);
    return { code: r.code, token: r.profToken };
  });
  on('prof:resume', (a) => {
    const r = getRoom(a.code);
    if (r.profToken !== a.token) fail('Sala não encontrada');
    leave(); room = r; prof = true;
    r.attachProf(socket.id);
  });
  on('prof:settings', (a) => teacher().setSettings(a));
  on('prof:sort', () => teacher().sortTeams());
  on('prof:move', (a) => teacher().move(Array.isArray(a.ids) ? a.ids.map(str) : [str(a.id)], Number(a.team)));
  on('prof:clear', () => teacher().clearTeams());
  on('prof:kick', (a) => teacher().kick(str(a.id)));
  on('prof:start', () => teacher().start());
  on('prof:pause', () => teacher().pause());
  on('prof:time', () => teacher().addTime());
  on('prof:skip', () => teacher().skip());
  on('prof:imp', (a) => teacher().profImp(a.target, a.kind));
  on('prof:end', () => teacher().finish());
  on('prof:reveal', () => teacher().reveal());
  on('prof:lobby', () => teacher().toLobby());
  on('prof:close', () => { const r = teacher(); closeRoom(r); room = null; prof = false; console.log(`sala ${r.code} fechada`); });

  // alunos
  on('join', (a) => {
    const r = getRoom(a.code);
    leave();
    const p = r.join(str(a.name), socket.id);
    room = r; pid = p.id;
    return { token: p.token };
  });
  on('resume', (a) => {
    const r = getRoom(a.code);
    const p = [...r.players.values()].find((x) => x.token === a.token) ?? fail('Sessão expirada');
    leave(); room = r; pid = p.id;
    r.attach(p, socket.id);
  });
  on('leave', () => { const { r, p } = player(); r.leave(p); room = null; pid = null; });
  on('add', (a) => { const { r, p } = player(); r.add(p, str(a.id)); });
  on('remove', (a) => { const { r, p } = player(); r.remove(p, str(a.id)); });
  on('take', (a) => { const { r, p } = player(); r.take(p, str(a.id)); });
  on('spend', (a) => { const { r, p } = player(); return r.spend(p, str(a.id)); });
  on('help', () => { const { r, p } = player(); return r.help(p); });
  on('fs', (a) => { const { r, p } = player(); r.setFs(p, a.on === true); });

  socket.on('disconnect', leave);
});

setInterval(() => { const now = Date.now(); for (const r of rooms.values()) r.tick(now); }, 250);
// salas esquecidas somem depois de 3 horas sem movimento
setInterval(() => {
  for (const r of rooms.values()) if (Date.now() - r.lastActive > 3 * 3600_000) closeRoom(r);
}, 600_000);

http.listen(PORT, () => console.log(`Agência TI no ar na porta ${PORT}`));
