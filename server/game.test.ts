import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Room, Oops } from './game.ts';
import type { P, T } from './game.ts';
import { balance, splitEnergy, isOpen, PTS, seededShuffle } from '../shared/rules.ts';
import { clientById } from '../shared/clients.ts';
import type { Fx } from '../shared/types.ts';

const fxs: Fx[] = [];
const room = (n = 8) => {
  const r = new Room('TEST', (_sid, ev, data) => { if (ev === 'fx') fxs.push(data as Fx); });
  r.next = 'papelaria';
  for (let i = 0; i < n; i++) r.join(`Aluno ${i + 1}`, `sid${i}`);
  return r;
};
const throws = (fn: () => unknown, msg: RegExp) => assert.throws(fn, (e: unknown) => e instanceof Oops && msg.test(e.message));
const team = (r: Room, i = 0) => r.teams[i];
const mems = (r: Room, t: T) => r.members(t);
/** faz o cartão até ficar pronto, gastando a energia de quem tiver */
function finishCard(r: Room, t: T, id: string) {
  const c = t.cells.get(id)!;
  if (c.col === 'bank') r.add(mems(r, t)[0], id);
  if (c.col === 'todo') {
    const free = mems(r, t).find((p) => ![...t.cells.values()].some((x) => x.col === 'doing' && x.owner === p.id));
    r.take(free!, id);
  }
  while (c.col === 'doing') {
    const p = mems(r, t).find((m) => (t.energy.get(m.id) ?? 0) > 0);
    if (!p) return false;
    r.spend(p, id);
  }
  return true;
}

test('sorteio equilibrado: tamanhos diferem no máximo 1', () => {
  for (const [n, k] of [[13, 4], [7, 3], [24, 6], [5, 2]]) {
    const sizes = balance(Array.from({ length: n }, (_, i) => i), k).map((g) => g.length);
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1, `${n}/${k}: ${sizes}`);
    assert.equal(sizes.reduce((a, b) => a + b, 0), n);
  }
});

test('energia da equipe é dividida com diferença de no máximo 1', () => {
  assert.deepEqual(splitEnergy(8, 3), [3, 3, 2]);
  assert.deepEqual(splitEnergy(8, 4), [2, 2, 2, 2]);
  assert.deepEqual(splitEnergy(8, 5), [2, 2, 2, 1, 1]);
});

test('cadeado: cartão só abre com as dependências prontas', () => {
  const c = clientById('papelaria');
  const def = c.cards.find((d) => d.id === 'conectar')!;
  assert.equal(isOpen(def, { pc: { col: 'done', spent: 2 }, senha: { col: 'todo', spent: 0 } }), false);
  assert.equal(isOpen(def, { pc: { col: 'done', spent: 2 }, senha: { col: 'done', spent: 2 } }), true);
});

test('rodada completa: planejar, gastar energia, entregar e pontuar', () => {
  const r = room(8);
  r.setSettings({ teams: 2, days: 3 });
  r.sortTeams();
  assert.deepEqual(r.teams.map((t) => t.members.length), [4, 4]);
  r.start();
  assert.equal(r.phase, 'plan');
  const t = team(r), [a, b] = mems(r, t);
  r.add(a, 'roteador');
  throws(() => r.take(a, 'roteador'), /dia 1/);
  r.add(a, 'jogo'); // pegadinha no quadro
  r.skip();
  assert.equal(r.phase, 'day');
  assert.equal(r.day, 1);
  assert.deepEqual(mems(r, t).map((p) => t.energy.get(p.id)), [2, 2, 2, 2]);
  r.add(a, 'senha');
  throws(() => r.take(a, 'senha'), /espera/);
  r.take(a, 'roteador');
  r.add(b, 'pc');
  throws(() => r.take(a, 'pc'), /Termine/);
  r.spend(a, 'roteador');
  assert.equal(t.cells.get('roteador')!.col, 'done');
  r.take(b, 'pc');
  r.spend(a, 'pc'); // ajuda
  assert.equal(t.helps, 1);
  // termina o resto em dois dias
  const order = ['pc', 'senha', 'conta', 'conectar', 'internet', 'antivirus', 'planilha', 'ensinar'];
  for (let day = 1; day <= 3 && !t.delivered; day++) {
    for (const id of order) if (t.cells.get(id)!.col !== 'done') { const def = r.def(id)!; if (isOpen(def, t.cells)) finishCard(r, t, id); }
    if (!t.delivered && day < 3) r.startDay(day + 1);
  }
  assert.ok(t.delivered, 'equipe entregou');
  r.finish();
  const res = r.results!.teams.find((x) => x.id === t.id)!;
  assert.equal(res.done, 9);
  assert.equal(res.parts.cards, 9 * PTS.card);
  assert.equal(res.parts.prazo, PTS.prazo);
  assert.equal(res.parts.fora, -PTS.fora);
  assert.deepEqual(res.extras, ['jogo']);
  assert.equal(r.results!.teams[0].id, t.id, 'quem entregou fica em 1º');
  assert.equal(r.phase, 'results');
});

test('imprevistos mudam o quadro e a energia', () => {
  const r = room(6);
  r.setSettings({ teams: 2, autoImp: false });
  r.sortTeams(); r.start(); r.skip();
  const t = team(r), ms = mems(r, t);
  r.applyImp(t, 'faltou');
  assert.equal(ms.filter((p) => t.absent.has(p.id)).length, 1);
  assert.equal([...t.absent].map((id) => t.energy.get(id))[0], 0);
  const before = r.need(t).length;
  r.applyImp(t, 'extra');
  assert.equal(r.need(t).length, before + 1);
  assert.equal(t.cells.get('cartaz')!.col, 'todo');
  finishCard(r, t, 'roteador');
  r.applyImp(t, 'travou');
  assert.equal(t.cells.get('roteador')!.col, 'todo');
  r.add(ms[1], 'planilha');
  r.applyImp(t, 'atraso');
  const blocked = [...t.cells].filter(([, c]) => c.blockedDay === r.day).map(([id]) => id);
  assert.equal(blocked.length, 1);
  const e = [...t.energy.values()].reduce((x, y) => x + y, 0);
  r.applyImp(t, 'cafe');
  assert.equal([...t.energy.values()].reduce((x, y) => x + y, 0), e + ms.length - t.absent.size);
});

test('quem chega depois do sorteio vai para a menor equipe, com energia só no dia seguinte', () => {
  const r = room(5);
  r.setSettings({ teams: 2 });
  r.sortTeams(); r.start(); r.skip();
  const small = r.teams.findIndex((t) => t.members.length === 2);
  const p: P = r.join('Atrasado', 'sidX');
  assert.equal(p.team, small);
  assert.equal(r.teams[small].energy.get(p.id), 0);
});

test('professor monta as equipes à mão (arrastar ou clicar) e ninguém fica de fora', () => {
  const r = room(7);
  assert.equal(r.teams.length, 4, 'colunas vazias já existem');
  assert.ok([...r.players.values()].every((p) => p.team === null), 'quem entra antes fica sem equipe');
  const ids = [...r.players.keys()];
  r.move(ids.slice(0, 3), 0);
  r.move(ids.slice(3, 5), 2);
  assert.deepEqual(r.teams.map((t) => t.members.length), [3, 0, 2, 0]);
  r.move([ids[0]], -1);
  assert.equal(r.players.get(ids[0])!.team, null);
  r.setSettings({ teams: 3 });
  assert.equal(r.teams.length, 3);
  r.start(); // os 3 sem equipe vão para as menores equipes que já têm gente
  assert.ok([...r.players.values()].every((p) => p.team === 0 || p.team === 2));
  assert.equal(r.teams[1].members.length, 0, 'não cria equipe de uma pessoa só');
  assert.ok(Math.abs(r.teams[0].members.length - r.teams[2].members.length) <= 1);
});

test('ordem embaralhada: estável para a mesma semente e diferente entre equipes', () => {
  const ids = clientById('papelaria').cards.map((d) => d.id);
  const a = seededShuffle(ids, 'ABCD-1-0'), b = seededShuffle(ids, 'ABCD-1-0'), c = seededShuffle(ids, 'ABCD-1-1');
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.deepEqual([...a].sort(), [...ids].sort());
  // os cartões do pedido não ficam todos no começo
  const firstNine = a.slice(0, 9).filter((id) => !clientById('papelaria').cards.find((d) => d.id === id)!.x).length;
  assert.ok(firstNine < 9);
});

test('configurações ficam dentro dos limites', () => {
  const r = room(0);
  r.setSettings({ teams: 99, days: 0, dayMin: 2.7, planMin: 9, energy: 1 });
  assert.deepEqual([r.settings.teams, r.settings.days, r.settings.dayMin, r.settings.planMin, r.settings.energy], [8, 2, 2.5, 4, 4]);
});

test('aluno só recebe a própria equipe; professor recebe o resumo', () => {
  const r = room(4);
  r.setSettings({ teams: 2 }); r.sortTeams();
  const p = [...r.players.values()][0];
  const v = r.view(p, new Set(['room', 'teams', 'players']), true, true);
  assert.equal(v.team?.id, p.team);
  assert.equal(v.teams, undefined);
  assert.equal(v.players, undefined);
  const pv = r.view(null, new Set(['teams', 'players']), false, false);
  assert.equal(pv.teams?.length, 2);
  assert.equal(pv.players?.length, 4);
});
