import { useEffect, useState } from 'react';
import type { DragEvent, KeyboardEvent, MouseEvent } from 'react';
import { Clock, Hand, Lock, Maximize, PackageCheck, Pause, Plus, Undo2, Zap } from 'lucide-react';
import { call } from './net.ts';
import type { St } from './net.ts';
import { Bolts, Done, Face, Logo, leftOf, phaseLabel, tc, toast, useClock } from './ui.tsx';
import { AREAS, cardOf, clientById } from '../shared/clients.ts';
import type { CardDef } from '../shared/clients.ts';
import { fmt, isOpen, splitEnergy } from '../shared/rules.ts';
import type { Col, TeamView } from '../shared/types.ts';
import { sfx } from './sfx.ts';
import { TeamCard } from './Reveal.tsx';

// ---------- tela cheia obrigatória ----------
function useFullscreen() {
  const [fs, setFs] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const f = () => { const on = !!document.fullscreenElement; setFs(on); void call('fs', { on }); };
    f();
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);
  return fs;
}
function FullscreenGate() {
  const go = () => document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => toast('O navegador bloqueou a tela cheia. Tente de novo.', 'bad'));
  return (
    <div className="gate" role="dialog" aria-modal aria-labelledby="gate-t">
      <div className="gate-card">
        <span className="gate-ic"><Maximize size={30} /></span>
        <h2 id="gate-t">A agência trabalha em tela cheia</h2>
        <p>Assim nada atrapalha o quadro da equipe. O professor vê quem saiu da tela cheia.</p>
        <button className="btn primary lg" onClick={go} autoFocus><Maximize size={18} /> Entrar em tela cheia</button>
      </div>
    </div>
  );
}

export function Student({ v }: { v: St }) {
  const fs = useFullscreen();
  const room = v.room!;
  let screen;
  if (!v.team) screen = <Waiting v={v} />;
  else if (room.phase === 'lobby') screen = <TeamReady team={v.team} me={v.me?.id ?? ''} />;
  else if (room.phase === 'results') screen = <StudentResults v={v} />;
  else screen = <Board v={v} />;
  return <>{screen}{!fs && <FullscreenGate />}</>;
}

function Waiting({ v }: { v: St }) {
  return (
    <main className="center-page">
      <div className="wait-card">
        <Logo big />
        <h1>Você está na sala {v.room?.code}</h1>
        <p className="muted">Aguarde o professor montar as equipes.</p>
        <div className="loader" aria-hidden><i /><i /><i /></div>
      </div>
    </main>
  );
}

function TeamReady({ team, me }: { team: TeamView; me: string }) {
  return (
    <main className="center-page">
      <div className="wait-card" style={tc(team.color)}>
        <span className="team-badge big">Equipe {team.name}</span>
        <h1>Sua equipe está pronta</h1>
        <ul className="mates">
          {team.members.map((m) => <li key={m.id}><Face name={m.name} size={40} off={!m.on} /><span>{m.name}{m.id === me && ' (você)'}</span></li>)}
        </ul>
        <p className="muted">Sentem juntos. Quando o professor começar, leiam o pedido do cliente e planejem.</p>
      </div>
    </main>
  );
}

function StudentResults({ v }: { v: St }) {
  const r = v.results;
  const mine = r?.teams.findIndex((t) => t.id === v.team?.id) ?? -1;
  if (!r || !v.room?.revealed || mine < 0) {
    return (
      <main className="center-page">
        <div className="wait-card">
          <span className="pulse-dot" aria-hidden />
          <h1>Olhe o telão!</h1>
          <p className="muted">O professor está mostrando o ranking da rodada.</p>
        </div>
      </main>
    );
  }
  return (
    <main className="center-page scroll">
      <div className="result-mine">
        <h1>{mine + 1}º lugar</h1>
        <TeamCard t={r.teams[mine]} pos={mine + 1} client={clientById(r.clientId)} open />
        <p className="muted">Aguarde a próxima rodada.</p>
      </div>
    </main>
  );
}

// ---------- quadro da equipe ----------
type Ev = 'add' | 'remove' | 'take' | 'spend' | 'drop';
type Row = { id: string; col: Col; spent: number; owner: string | null; blocked: boolean; def: CardDef };
const COLS: [Col, string][] = [['todo', 'A fazer'], ['doing', 'Fazendo'], ['done', 'Pronto']];

function Board({ v }: { v: St }) {
  const room = v.room!, team = v.team!, me = v.me?.id ?? '';
  const client = clientById(room.clientId);
  const now = useClock(500);
  const rows: Row[] = team.cards.map(([id, col, spent, owner, blocked]) => ({ id, col, spent, owner, blocked: !!blocked, def: cardOf(client, id)! })).filter((r) => r.def);
  const cells = Object.fromEntries(rows.map((r) => [r.id, { col: r.col, spent: r.spent }]));
  const meM = team.members.find((m) => m.id === me);
  const myE = meM?.energy ?? 0;
  // energia máxima de cada um hoje (mesma divisão do servidor: o +1 roda entre os integrantes)
  const split = splitEnergy(room.settings.energy, team.members.length);
  const maxOf = (id: string) => { const i = team.members.findIndex((m) => m.id === id); return i < 0 ? 0 : split[(i + room.day) % split.length]; };
  const mine = rows.find((r) => r.col === 'doing' && r.owner === me);
  const nameOf = (id: string | null) => team.members.find((m) => m.id === id)?.name ?? '';
  const need = rows.filter((r) => r.col !== 'bank' && !r.def.x);
  const total = client.cards.filter((d) => !d.x).length + (team.bonus ? 1 : 0);
  const done = rows.filter((r) => r.col === 'done' && !r.def.x).length;
  const left = leftOf(room, now);
  const day = room.phase === 'day';
  const frozen = room.paused || !!team.delivered;

  const act = async (ev: Ev, id: string) => {
    if (frozen) return toast(room.paused ? 'O jogo está pausado' : 'Pedido entregue: aguarde as outras equipes');
    if (ev === 'spend' && myE <= 0) { sfx.no(); return toast(meM?.absent ? 'Você faltou hoje: ajude a equipe conversando' : 'Sua energia acabou hoje. Ajude a equipe a planejar!', 'bad'); }
    const r = await call(ev, { id });
    if (!r.ok) { sfx.no(); return toast(r.err ?? 'Não deu', 'bad'); }
    if (ev === 'spend') (r.done ? sfx.done : sfx.zap)(); else sfx.tap();
  };
  const help = async () => { const r = await call('help'); if (!r.ok) toast(r.err ?? 'Não deu', 'bad'); else { sfx.tap(); toast(r.help ? 'Pedido de ajuda enviado para a equipe' : 'Pedido de ajuda cancelado'); } };

  // mover cartão: arrastar, ou clicar no cartão e depois na coluna (para quem tem dificuldade em arrastar)
  const [sel, setSel] = useState<string | null>(null);
  const [over, setOver] = useState<Col | null>(null);
  const selRow = rows.find((r) => r.id === sel) ?? null;
  useEffect(() => {
    const f = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setSel(null); };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  }, []);
  const moveTo = async (id: string, to: Col) => {
    setSel(null); setOver(null);
    const r = rows.find((x) => x.id === id);
    if (!r || r.col === to) return;
    const from = r.col;
    if (from === 'bank' && to === 'todo') return act('add', id);
    if (from === 'todo' && to === 'bank') return act('remove', id);
    if (from === 'todo' && to === 'doing') return act('take', id);
    if (from === 'bank' && to === 'doing') { await act('add', id); if (day) await act('take', id); return; }
    if (from === 'doing' && to === 'todo') return act('drop', id);
    if (from === 'doing' && to === 'bank') { sfx.no(); return toast('Primeiro devolva o cartão para A fazer', 'bad'); }
    sfx.no();
    if (to === 'done') return toast(from === 'doing' ? 'Gaste energia: o cartão vai para Pronto quando a barra enche' : 'Primeiro leve o cartão para Fazendo e gaste energia', 'bad');
    return toast('Cartão pronto fica em Pronto', 'bad');
  };
  const pick = (r: Row, e: MouseEvent | KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (selRow && selRow.id !== r.id && selRow.col !== r.col) return moveTo(selRow.id, r.col); // clicou num cartão de outra coluna
    setSel((x) => (x === r.id ? null : r.id)); sfx.tap();
  };
  const zone = (c: Col) => ({
    onDragOver: (e: DragEvent) => { e.preventDefault(); if (over !== c) setOver(c); },
    onDragLeave: (e: DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); },
    onDrop: (e: DragEvent) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) void moveTo(id, c); },
    onClick: (e: MouseEvent) => { if (selRow && !(e.target as HTMLElement).closest('button, .card, .bank-row')) void moveTo(selRow.id, c); },
  });
  const drag = (id: string) => (e: DragEvent) => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; setSel(null); };
  const armed = (c: Col) => (selRow && selRow.col !== c ? 'armed' : '');

  const tip = room.paused ? 'Jogo pausado pelo professor.'
    : team.delivered ? `Pedido entregue no dia ${team.delivered.day}! Aguardem as outras equipes.`
    : room.phase === 'plan' ? 'Planejamento: leiam o pedido e levem para A fazer só o que o cliente pediu.'
    : meM?.absent ? 'Você faltou hoje: sem energia. Ajude a equipe a decidir o próximo passo.'
    : !mine ? 'Pegue um cartão liberado em A fazer.'
    : myE > 0 ? 'Gaste energia no seu cartão. Ele fica pronto quando a barra enche.'
    : 'Sua energia acabou hoje. Converse com a equipe e prepare o próximo dia.';

  const bank = rows.filter((r) => r.col === 'bank').sort((a, b) => a.def.t.localeCompare(b.def.t, 'pt-BR'));
  const order = (c: Col) => rows.filter((r) => r.col === c).sort((a, b) => {
    if (c === 'doing') return Number(b.owner === me) - Number(a.owner === me);
    if (c === 'todo') return Number(isOpen(b.def, cells) && !b.blocked) - Number(isOpen(a.def, cells) && !a.blocked);
    return 0;
  });

  return (
    <div className="ws" style={tc(team.color)}>
      <aside className="side">
        <Logo />
        <section className="side-team">
          <span className="team-badge">Equipe {team.name}</span>
          <ul className="members">
            {team.members.map((m) => (
              <li key={m.id} className={`${m.on ? '' : 'off'} ${m.id === me ? 'me' : ''}`}>
                <Face name={m.name} size={30} off={!m.on} />
                <span className="m-name">{m.name}{m.id === me && <small> você</small>}</span>
                {m.absent ? <span className="m-tag bad">faltou</span> : m.help ? <span className="m-tag help">ajuda</span> : day ? <Bolts n={m.energy} max={maxOf(m.id)} size={13} /> : null}
              </li>
            ))}
          </ul>
        </section>
        <section className={`side-bank ${armed('bank')} ${over === 'bank' ? 'over' : ''}`} {...zone('bank')}>
          <h3>Banco de cartões <span className="count">{bank.length}</span></h3>
          <p className="muted small">Leve para A fazer só o que o cliente pediu: clique no +, arraste, ou clique no cartão e depois na coluna. Cartão fora do pedido tira 5 pontos.</p>
          <ul className="bank">
            {bank.map((r) => (
              <li key={r.id}>
                <div role="button" tabIndex={0} aria-pressed={sel === r.id} className={`bank-row ${sel === r.id ? 'sel' : ''}`}
                  draggable={!frozen} onDragStart={drag(r.id)} onClick={(e) => pick(r, e)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(r, e); } }}>
                  <span className={`dot a-${r.def.a}`} aria-hidden />
                  <span className="bank-t">{r.def.t}</span>
                  <span className="bank-c"><Zap size={12} />{r.def.c}</span>
                  <button className="icon-btn bank-plus" title="Levar para A fazer" aria-label={`Levar ${r.def.t} para A fazer`} onClick={() => act('add', r.id)}><Plus size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <main className="main">
        <header className="head">
          <div className="head-title">
            <span className="kicker">Pedido do cliente · {client.who}</span>
            <h1>{client.name}</h1>
            <p className="ask">“{client.ask}”</p>
          </div>
          <div className="head-stats">
            <span className={`chip ${room.phase}`}>{room.paused ? <><Pause size={14} /> Pausado</> : phaseLabel(room)}</span>
            <span className={`timer ${left < 30_000 && !room.paused ? 'hurry' : ''}`}><Clock size={18} />{fmt(left)}</span>
            {day && <span className="my-energy" title="Sua energia hoje"><Bolts n={myE} max={maxOf(me)} size={22} /><small>sua energia</small></span>}
          </div>
        </header>

        <div className="toolbar">
          <div className="prog">
            <span><b>{done}</b> de {total} cartões do pedido prontos</span>
            <div className="bar"><i style={{ transform: `scaleX(${total ? done / total : 0})` }} /></div>
          </div>
          {selRow ? (
            <p className="tip pick">Agora clique na coluna para onde quer levar “{selRow.def.t}” <button className="btn sm ghost" onClick={() => setSel(null)}>Cancelar</button></p>
          ) : <p className={`tip ${room.phase}`}>{tip}</p>}
          {day && mine && !frozen && (
            <button className={`btn ${meM?.help ? 'warn' : 'primary'}`} onClick={help}><Hand size={17} /> {meM?.help ? 'Ajuda pedida' : 'Pedir ajuda'}</button>
          )}
        </div>

        {team.delivered && <div className="delivered-bar"><PackageCheck size={20} /> Pedido entregue no dia {team.delivered.day}!</div>}

        <div className="board">
          {COLS.map(([c, label]) => {
            const list = order(c);
            const n = c === 'done' ? list.filter((r) => !r.def.x).length : list.length;
            return (
              <section key={c} className={`col col-${c} ${armed(c)} ${over === c ? 'over' : ''}`} aria-label={label} {...zone(c)}>
                <h2>{label} <span className="count">{n}</span></h2>
                <div className="col-list">
                  {list.map((r) => (
                    <Card key={r.id} r={r} me={me} day={day} myE={myE} open={isOpen(r.def, cells)} bonus={r.id === client.bonus.id}
                      ownerName={nameOf(r.owner)} ownerHelp={!!team.members.find((m) => m.id === r.owner)?.help}
                      depTitle={(r.def.deps ?? []).map((d) => cardOf(client, d)).find((d) => d && cells[d.id]?.col !== 'done')?.t ?? ''}
                      onAct={act} sel={sel === r.id} canDrag={!frozen && r.col !== 'done'} onDrag={drag(r.id)} onPick={(e) => pick(r, e)} />
                  ))}
                  {c === 'todo' && need.length === 0 && <p className="empty">Leve os cartões do banco para cá.</p>}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function Card({ r, me, day, myE, open, bonus, ownerName, ownerHelp, depTitle, onAct, sel, canDrag, onDrag, onPick }: {
  r: Row; me: string; day: boolean; myE: number; open: boolean; bonus: boolean; ownerName: string; ownerHelp: boolean; depTitle: string;
  onAct: (ev: Ev, id: string) => void; sel: boolean; canDrag: boolean; onDrag: (e: DragEvent) => void; onPick: (e: MouseEvent | KeyboardEvent) => void;
}) {
  const locked = r.col !== 'done' && !open;
  const cls = ['card', `in-${r.col}`, locked && 'locked', r.blocked && 'blocked', r.owner === me && r.col === 'doing' && 'mine', ownerHelp && r.col === 'doing' && 'helpme', sel && 'sel'].filter(Boolean).join(' ');
  let foot = null;
  if (r.col === 'done') foot = <span className="st ok"><Done /> Pronto</span>;
  else if (locked) foot = <span className="st lock"><Lock size={14} /> Depois de: {depTitle}</span>;
  else if (r.blocked) foot = <span className="st warn"><Clock size={14} /> Peça atrasada: volta amanhã</span>;
  else if (r.col === 'todo') foot = day ? <button className="btn sm" onClick={() => onAct('take', r.id)}>Pegar</button> : <span className="st">Liberado para o dia 1</span>;
  else if (r.col === 'doing') {
    foot = r.owner === me
      ? <button className={`btn sm primary ${myE <= 0 ? 'soft' : ''}`} onClick={() => onAct('spend', r.id)}><Zap size={15} /> Gastar energia</button>
      : <button className={`btn sm ${myE <= 0 ? 'soft' : ''}`} onClick={() => onAct('spend', r.id)}><Zap size={15} /> Ajudar</button>;
  }
  return (
    <article className={cls} draggable={canDrag} onDragStart={onDrag} onClick={onPick} tabIndex={0} aria-pressed={sel}
      aria-label={`${r.def.t}. Clique para escolher e depois clique na coluna, ou arraste.`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(e); } }}>
      <div className="card-top">
        <span className={`tag a-${r.def.a}`}>{AREAS[r.def.a]}</span>
        {bonus && <span className="tag new">Pedido extra</span>}
        <span className="grow" />
        {r.col === 'todo' && r.spent === 0 && !bonus && (
          <button className="icon-btn" title="Devolver ao banco" aria-label={`Devolver ${r.def.t} ao banco`} onClick={() => onAct('remove', r.id)}><Undo2 size={15} /></button>
        )}
        {r.owner && r.col !== 'todo' && <Face name={ownerName || '?'} size={26} title={ownerName} />}
      </div>
      <h3>{r.def.t}</h3>
      <p className="desc">{r.def.d}</p>
      {ownerHelp && r.col === 'doing' && r.owner !== me && <span className="help-flag"><Hand size={13} /> {ownerName} pediu ajuda</span>}
      <div className="card-prog">
        <span className="spent"><Zap size={13} /> {r.spent}/{r.def.c}</span>
        <div className="bar"><i style={{ transform: `scaleX(${r.spent / r.def.c})` }} /></div>
      </div>
      <div className="card-foot">{foot}</div>
    </article>
  );
}
