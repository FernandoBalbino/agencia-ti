import { useEffect, useState } from 'react';
import type { CSSProperties, DragEvent, ReactNode } from 'react';
import {
  AlertTriangle, ArrowRight, Clock, Coffee, Eraser, FastForward, GripVertical, PackageCheck, Flag, Maximize, Minus, MonitorOff, Pause, Play, Plus, Presentation,
  Shuffle, Timer, UserX, Users, Volume2, VolumeX, X, Zap,
} from 'lucide-react';
import { call, leaveRoom, useFx } from './net.ts';
import type { St } from './net.ts';
import { Done, Face, Logo, leftOf, phaseLabel, tc, toast, useClock } from './ui.tsx';
import { Reveal } from './Reveal.tsx';
import { CLIENTS, clientById } from '../shared/clients.ts';
import { IMP, LIMITS, fmt } from '../shared/rules.ts';
import type { ImpKind, PlayerRow, Settings } from '../shared/types.ts';
import { setSound, sfx, soundOn } from './sfx.ts';

const BASE = import.meta.env.BASE_URL;
const joinUrl = () => `${location.origin}${BASE}`.replace(/^https?:\/\//, '').replace(/\/$/, '');
const go = async (ev: string, data: object = {}) => { const r = await call(ev, data); if (!r.ok) toast(r.err ?? 'Não deu', 'bad'); return r; };

export function Teacher({ v }: { v: St }) {
  const room = v.room!;
  if (room.phase === 'lobby') return <ProfLobby v={v} />;
  if (room.phase === 'results') return <Reveal v={v} />;
  return <Telao v={v} />;
}

function FsButton() {
  const [fs, setFs] = useState(!!document.fullscreenElement);
  useEffect(() => { const f = () => setFs(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f); }, []);
  const toggle = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())?.catch(() => {});
  return <button className="btn ghost" onClick={toggle} title="Tela cheia (telão)"><Maximize size={17} />{fs ? 'Sair da tela cheia' : 'Tela cheia'}</button>;
}

function Stepper({ label, value, k, step = 1, unit, hint }: { label: string; value: number; k: keyof typeof LIMITS; step?: number; unit?: string; hint?: ReactNode }) {
  const [lo, hi] = LIMITS[k];
  const set = (x: number) => go('prof:settings', { [k]: Math.min(hi, Math.max(lo, x)) });
  return (
    <div className="stepper">
      <div><span className="st-label">{label}</span>{hint && <span className="st-hint">{hint}</span>}</div>
      <div className="st-ctrl">
        <button className="icon-btn" aria-label={`Menos: ${label}`} onClick={() => set(value - step)} disabled={value <= lo}><Minus size={16} /></button>
        <b>{String(value).replace('.', ',')}{unit && <small> {unit}</small>}</b>
        <button className="icon-btn" aria-label={`Mais: ${label}`} onClick={() => set(value + step)} disabled={value >= hi}><Plus size={16} /></button>
      </div>
    </div>
  );
}

function ProfLobby({ v }: { v: St }) {
  const room = v.room!, s: Settings = room.settings;
  const players = v.players ?? [], teams = v.teams ?? [];
  const [sel, setSel] = useState<string[]>([]);
  const [over, setOver] = useState<number | null>(null);
  const per = players.length ? Math.round((players.length / Math.min(s.teams, players.length)) * 10) / 10 : 0;
  const perE = per ? Math.round((s.energy / per) * 10) / 10 : 0;
  const total = s.planMin + s.days * s.dayMin;
  const noFs = players.filter((p) => p.on && !p.fs).length;
  const free = players.filter((p) => p.team === null || !teams[p.team]);
  const placed = players.length - free.length;
  const ready = teams.filter((t) => players.some((p) => p.team === t.id)).length;

  const toggle = (id: string) => { setSel((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id])); sfx.tap(); };
  const place = async (team: number, ids = sel) => {
    if (!ids.length) return;
    setSel([]); setOver(null);
    const r = await go('prof:move', { ids, team });
    if (r.ok) sfx.tap();
  };
  // soltar um aluno arrastado; se ele estava entre os selecionados, leva todos os selecionados juntos
  const drop = (team: number) => (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) place(team, sel.includes(id) ? sel : [id]);
  };
  const zone = (team: number) => ({
    onDragOver: (e: DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (over !== team) setOver(team); },
    onDragLeave: (e: DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); },
    onDrop: drop(team),
  });
  const chip = (p: PlayerRow, kick: boolean) => (
    <li key={p.id}>
      <div role="button" tabIndex={0} draggable aria-pressed={sel.includes(p.id)}
        className={`chip-p ${sel.includes(p.id) ? 'sel' : ''} ${p.on ? '' : 'off'}`}
        onDragStart={(e) => { e.dataTransfer.setData('text/plain', p.id); e.dataTransfer.effectAllowed = 'move'; }}
        onDragEnd={() => setOver(null)}
        onClick={() => toggle(p.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(p.id); } }}>
        <GripVertical size={14} className="grip" />
        <Face name={p.name} size={26} off={!p.on} />
        <span className="p-name">{p.name}</span>
        {p.on && !p.fs && <span className="p-warn" title="Fora da tela cheia"><MonitorOff size={14} /></span>}
        {kick && <button className="icon-btn" title={`Tirar ${p.name} da sala`} aria-label={`Tirar ${p.name} da sala`} onClick={(e) => { e.stopPropagation(); go('prof:kick', { id: p.id }); }}><X size={14} /></button>}
      </div>
    </li>
  );

  return (
    <main className="prof">
      <header className="prof-head">
        <Logo />
        <div className="join-box">
          <span className="muted">Entre em</span> <b className="url">{joinUrl()}</b>
          <span className="muted">com o código</span> <b className="big-code">{room.code}</b>
        </div>
        <div className="head-actions">
          <a className="btn ghost" href={`${BASE}slide/`} target="_blank" rel="noreferrer"><Presentation size={17} /> Aula</a>
          <FsButton />
          <button className="btn ghost" onClick={() => leaveRoom(true)}>Encerrar sala</button>
        </div>
      </header>

      <div className="prof-grid">
        <section className="panel">
          <div className="panel-head">
            <h2><Users size={18} /> Equipes <span className="count">{placed}/{players.length}</span></h2>
            <div className="row-btns">
              {noFs > 0 && <span className="pill warn"><MonitorOff size={14} /> {noFs} fora da tela cheia</span>}
              <button className="btn sm" onClick={() => go('prof:sort')} disabled={players.length < 2}><Shuffle size={15} /> Sortear</button>
              <button className="btn sm ghost" onClick={() => { setSel([]); go('prof:clear'); }} disabled={!placed}><Eraser size={15} /> Esvaziar</button>
            </div>
          </div>
          <p className="muted small how">
            Arraste cada aluno para a equipe dele, ou clique nos alunos e depois na equipe. Dica: monte pelas cadeiras da sala, para quem é da mesma equipe sentar junto.
          </p>

          <div className={`pool zone ${over === -1 ? 'over' : ''} ${sel.length ? 'armed' : ''}`} {...zone(-1)} onClick={(e) => { if (e.target === e.currentTarget) place(-1); }}>
            <h3>Sem equipe <span className="count">{free.length}</span>{sel.some((id) => !free.some((p) => p.id === id)) && <button className="btn sm ghost" onClick={() => place(-1)}>Tirar das equipes</button>}</h3>
            {players.length === 0 ? <p className="empty">Os nomes aparecem aqui quando os alunos entrarem.</p>
              : free.length === 0 ? <p className="empty">Todos os alunos já estão em uma equipe.</p>
              : <ul className="chips">{free.map((p) => chip(p, true))}</ul>}
          </div>

          <div className="team-cols">
            {teams.map((t) => {
              const list = players.filter((p) => p.team === t.id);
              return (
                <div key={t.id} className={`team-col zone ${over === t.id ? 'over' : ''} ${sel.length ? 'armed' : ''}`} style={tc(t.color)}
                  {...zone(t.id)} onClick={(e) => { if (!(e.target as HTMLElement).closest('.chip-p, button')) place(t.id); }}>
                  <h3><span className="swatch" /> {t.name} <span className="count">{list.length}</span></h3>
                  <ul className="chips stack">{list.map((p) => chip(p, false))}</ul>
                  {sel.length > 0 ? <button className="btn sm put" onClick={() => place(t.id)}><Plus size={15} /> Colocar {sel.length === 1 ? 'aqui' : `os ${sel.length} aqui`}</button>
                    : list.length === 0 && <p className="drop-hint">Solte os alunos aqui</p>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel config">
          <h2>Configuração da partida</h2>
          <Stepper label="Equipes" k="teams" value={s.teams} hint={per ? `≈ ${String(per).replace('.', ',')} alunos por equipe` : 'colunas para montar'} />
          <Stepper label="Dias por rodada" k="days" value={s.days} />
          <Stepper label="Tempo de cada dia" k="dayMin" value={s.dayMin} step={0.5} unit="min" />
          <Stepper label="Planejamento" k="planMin" value={s.planMin} unit="min" />
          <Stepper label="Energia da equipe por dia" k="energy" value={s.energy} unit="⚡" hint={perE ? `≈ ${String(perE).replace('.', ',')} ⚡ por aluno` : undefined} />
          <label className="toggle">
            <input type="checkbox" checked={s.autoImp} onChange={(e) => go('prof:settings', { autoImp: e.target.checked })} />
            <span><b>Imprevistos automáticos</b><small>Um imprevisto igual para todas as equipes a partir do dia 2.</small></span>
          </label>
          <label className="field">
            <span>Cliente da rodada</span>
            <select value={room.next} onChange={(e) => go('prof:settings', { next: e.target.value })}>
              <option value="random">Sortear</option>
              {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <p className="muted small"><Timer size={14} /> Cada rodada dura cerca de {String(total).replace('.', ',')} minutos.</p>
          <button className="btn primary lg" onClick={() => go('prof:start')} disabled={!ready}>Começar rodada <ArrowRight size={18} /></button>
          {free.length > 0 && placed > 0 && <p className="muted small">Quem ficar sem equipe vai para as menores equipes ao começar.</p>}
          {room.round > 0 && <p className="muted small">Sortear ou esvaziar zera os pontos acumulados.</p>}
        </section>
      </div>
    </main>
  );
}

const KIND_LIST = Object.keys(IMP) as ImpKind[];

function Telao({ v }: { v: St }) {
  const room = v.room!, teams = v.teams ?? [], players = v.players ?? [];
  const client = clientById(room.clientId);
  const now = useClock(250);
  const left = leftOf(room, now);
  const [imp, setImp] = useState(false);
  const [target, setTarget] = useState('random');
  const [kind, setKind] = useState('random');
  const [snd, setSnd] = useState(soundOn());
  const noFs = players.filter((p) => p.on && !p.fs && p.team !== null);
  const active = teams.filter((t) => t.members.length);
  const rank = [...active].sort((a, b) => (b.done / b.total) - (a.done / a.total) || b.energy - a.energy).map((t) => t.id);
  const plan = room.phase === 'plan';
  const [feed, setFeed] = useState<{ id: number; kind: 'bad' | 'good'; who: string; color: number; text: string }[]>([]);
  useFx((f) => {
    const add = (x: Omit<(typeof feed)[number], 'id'>) => setFeed((l) => [{ ...x, id: Date.now() + Math.random() }, ...l].slice(0, 5));
    if (f.t === 'imp') add({ kind: IMP[f.kind].good ? 'good' : 'bad', who: f.team === null ? f.name : `Equipe ${f.name}`, color: f.color, text: `${IMP[f.kind].title}: ${f.text}` });
    if (f.t === 'delivered') add({ kind: 'good', who: `Equipe ${f.name}`, color: f.color, text: 'entregou o pedido!' });
    if (f.t === 'day') add({ kind: 'good', who: `Dia ${f.day}`, color: -1, text: 'começou. A energia de todos foi recarregada.' });
  });
  const shoot = async () => { const r = await go('prof:imp', { target, kind }); if (r.ok) setImp(false); };

  return (
    <main className="telao">
      <header className="tv-head">
        <Logo />
        <div className="tv-client">
          <span className="kicker">Rodada {room.round} · {client.who}</span>
          <h1>{client.name}</h1>
        </div>
        <div className="tv-clock">
          <span className={`chip ${room.phase}`}>{room.paused ? 'Pausado' : phaseLabel(room)}</span>
          <span className={`tv-time ${left < 30_000 && !room.paused ? 'hurry' : ''}`}>{fmt(left)}</span>
        </div>
        <div className="tv-code"><span>sala</span><b>{room.code}</b></div>
      </header>

      {plan && (
        <section className="tv-plan">
          <p className="tv-ask">“{client.ask}”</p>
          <p className="muted">Planejamento: cada equipe escolhe no banco os cartões que o cliente pediu. Os cartões começam no dia 1.</p>
        </section>
      )}

      <section className="race" style={{ '--cols': active.length <= 4 ? active.length : active.length <= 6 ? 3 : 4 } as CSSProperties}>
        {active.map((t) => (
          <article key={t.id} className={`race-card ${t.delivered ? 'delivered' : ''}`} style={tc(t.color)}>
            <header>
              <span className="rank">{rank.indexOf(t.id) + 1}º</span>
              <h2>{t.name}</h2>
              <span className="faces">{t.members.map((m) => <Face key={m.id} name={m.name} size={26} off={!m.on} />)}</span>
            </header>
            <div className="race-num"><b>{t.done}</b><span>/{t.total} prontos</span></div>
            <div className="bar big"><i style={{ transform: `scaleX(${t.total ? t.done / t.total : 0})` }} /></div>
            <footer>
              {t.delivered ? <span className="pill ok"><Done /> Entregue no dia {t.delivered.day}</span> : (
                <>
                  <span>A fazer <b>{t.todo}</b></span>
                  <span>Fazendo <b>{t.doing}</b></span>
                  {!plan && <span className="en"><Zap size={15} /><b>{t.energy}</b></span>}
                  {t.events > 0 && <span className="ev"><AlertTriangle size={15} /><b>{t.events}</b></span>}
                </>
              )}
            </footer>
          </article>
        ))}
      </section>

      {!plan && (
        <section className="tv-bottom">
          <div className="tv-box">
            <h3>Pedido do cliente</h3>
            <p className="tv-ask">“{client.ask}”</p>
          </div>
          <div className="tv-box">
            <h3>Acontecimentos</h3>
            {feed.length ? (
              <ul className="feed">
                {feed.map((e) => {
                  const Icon = e.text.startsWith('entregou') ? PackageCheck : e.kind === 'good' && e.color >= 0 ? Coffee : e.kind === 'good' ? Zap : AlertTriangle;
                  return <li key={e.id} className={e.kind} style={tc(e.color)}><Icon size={18} /><span><b>{e.who}</b> {e.text}</span></li>;
                })}
              </ul>
            ) : <p className="muted">Os imprevistos e as entregas aparecem aqui.</p>}
          </div>
        </section>
      )}

      {noFs.length > 0 && <p className="tv-warn" title={noFs.map((p) => p.name).join(', ')}><MonitorOff size={16} /> Fora da tela cheia: {noFs.map((p) => p.name).join(', ')}</p>}

      <nav className="dock" aria-label="Controles do professor">
        <button className="btn" onClick={() => go('prof:pause')}>{room.paused ? <><Play size={17} /> Continuar</> : <><Pause size={17} /> Pausar</>}</button>
        <button className="btn" onClick={() => go('prof:time')}><Clock size={17} /> +1 min</button>
        <button className="btn" onClick={() => go('prof:skip')}><FastForward size={17} /> {plan ? 'Começar o dia 1' : room.day < room.settings.days ? 'Próximo dia' : 'Terminar o dia'}</button>
        <div className="imp-wrap">
          <button className="btn warn" onClick={() => setImp((x) => !x)} disabled={plan} aria-expanded={imp}><AlertTriangle size={17} /> Imprevisto</button>
          {imp && (
            <div className="imp-pop" role="dialog" aria-label="Soltar imprevisto">
              <label className="field"><span>Para</span>
                <select value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value="random">Equipe sorteada</option>
                  <option value="leader">Equipe na liderança</option>
                  <option value="all">Todas as equipes</option>
                  {active.filter((t) => !t.delivered).map((t) => <option key={t.id} value={t.id}>Equipe {t.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Tipo</span>
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="random">Sortear</option>
                  {KIND_LIST.map((k) => <option key={k} value={k}>{IMP[k].title}</option>)}
                </select>
              </label>
              <button className="btn primary" onClick={shoot}>Soltar agora</button>
            </div>
          )}
        </div>
        <button className="btn" onClick={() => go('prof:end')}><Flag size={17} /> Encerrar rodada</button>
        <span className="grow" />
        <button className="btn ghost" onClick={() => { setSound(!snd); setSnd(!snd); }} aria-label={snd ? 'Desligar som' : 'Ligar som'}>{snd ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
        <FsButton />
        {players.some((p) => !p.on) && <span className="muted small"><UserX size={14} /> {players.filter((p) => !p.on).length} offline</span>}
      </nav>
    </main>
  );
}
