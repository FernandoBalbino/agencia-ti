// Checagem rápida do servidor publicado (uma sala, dois alunos, alguns eventos; quase nada de banda).
//   node tests/prod-check.mjs [servidor]
import { io } from 'socket.io-client';

const URL = process.argv[2] ?? 'https://agencia-ti-oxa7.onrender.com';
// a promessa de conexão nasce junto com o socket (senão a conexão pode chegar antes de alguém esperar por ela)
const mk = () => { const s = io(URL, { transports: ['websocket'] }); s.ok = new Promise((r) => s.once('connect', r)); return s; };
const call = (s, ev, d = {}) => new Promise((r) => s.emit(ev, d, r));
const ready = (s) => s.ok;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('FALHOU: sem resposta do servidor'); process.exit(1); }, 90_000);

const prof = mk(); await ready(prof);
let teams = [], players = [];
prof.on('view', (v) => { if (v.teams) teams = v.teams; if (v.players) players = v.players; });
const r = await call(prof, 'prof:create');
const a = mk(), b = mk(); await ready(a); await ready(b);
await call(a, 'join', { code: r.code, name: 'Teste A' }); await call(b, 'join', { code: r.code, name: 'Teste B' });
await wait(500);
const ids = players.map((p) => p.id);
const checks = {
  'colunas de equipe já criadas': teams.length === 4,
  'mover vários alunos de uma vez': (await call(prof, 'prof:move', { ids, team: 1 })).ok,
  'esvaziar equipes': (await call(prof, 'prof:clear')).ok,
};
await call(prof, 'prof:move', { ids, team: 0 });
checks['começar rodada'] = (await call(prof, 'prof:start')).ok;
checks['ação de devolver cartão'] = ((await call(a, 'drop', { id: 'pc' })).err ?? '').length > 0; // existe e valida
checks['pegadinha nova no catálogo'] = (await call(a, 'add', { id: 'vendas' })).ok || (await call(a, 'add', { id: 'papelsenha' })).ok || (await call(a, 'add', { id: 'produtos' })).ok
  || (await call(a, 'add', { id: 'editorum' })).ok || (await call(a, 'add', { id: 'imprimir' })).ok || (await call(a, 'add', { id: 'emailtodos' })).ok;
await call(prof, 'prof:close');
const bad = Object.entries(checks).filter(([, ok]) => !ok);
for (const [k, ok] of Object.entries(checks)) console.log(`${ok ? 'ok ' : 'NÃO'} ${k}`);
process.exit(bad.length ? 1 : 0);
