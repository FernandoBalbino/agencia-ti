import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronRight, Crown, Home, Hand, LogOut, PackageCheck, PackageX, SkipForward, Trophy } from 'lucide-react';
import { call, leaveRoom } from './net.ts';
import type { St } from './net.ts';
import { Confetti, Face, Logo, tc, toast } from './ui.tsx';
import { CLIENTS, cardOf, clientById } from '../shared/clients.ts';
import type { Client } from '../shared/clients.ts';
import { IMP, fmt } from '../shared/rules.ts';
import type { TeamResult } from '../shared/types.ts';
import { sfx } from './sfx.ts';

function useCount(target: number, ms = 900, key: unknown = target) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(target); return; }
    let raf = 0; const t0 = performance.now();
    const f = (t: number) => { const p = Math.min(1, (t - t0) / ms); setN(Math.round(target * (1 - (1 - p) ** 3))); if (p < 1) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return n;
}

const sign = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

/** cartão de resultado de uma equipe, com o resumo da missão */
export function TeamCard({ t, pos, client, open, big }: { t: TeamResult; pos: number; client: Client; open?: boolean; big?: boolean }) {
  const pts = useCount(t.pts, big ? 1400 : 600, `${t.id}-${t.pts}`);
  const title = (id: string) => cardOf(client, id)?.t ?? id;
  return (
    <article className={`tcard ${big ? 'big' : ''} ${pos === 1 ? 'first' : ''}`} style={tc(t.color)}>
      <header>
        <span className="pos">{pos}º</span>
        <div className="tcard-name">
          <h3>Equipe {t.name}</h3>
          <span className="faces">{t.members.map((m) => <Face key={m} name={m} size={big ? 34 : 24} />)}</span>
        </div>
        <span className="pts"><b>{pts}</b> pts</span>
      </header>
      <div className="parts">
        <span>Cartões prontos <b>{sign(t.parts.cards)}</b></span>
        <span>No prazo <b>{sign(t.parts.prazo)}</b></span>
        <span>Energia que sobrou <b>{sign(t.parts.sobra)}</b></span>
        <span className={t.parts.fora ? 'neg' : ''}>Fora do pedido <b>{sign(t.parts.fora)}</b></span>
      </div>
      {open && (
        <div className="resumo">
          <div>
            <h4>{t.delivered ? <PackageCheck size={15} /> : <PackageX size={15} />} Missão</h4>
            <p>{t.done} de {t.total} cartões do pedido prontos. {t.delivered ? `Entregou no dia ${t.delivered.day}, aos ${fmt(t.delivered.ms)}.` : 'Não entregou tudo no prazo.'}</p>
          </div>
          {t.missing.length > 0 && <div><h4>Faltou fazer</h4><ul>{t.missing.map((id) => <li key={id}>{title(id)}</li>)}</ul></div>}
          {t.extras.length > 0 && <div><h4>Fora do pedido</h4><ul>{t.extras.map((id) => <li key={id}>{title(id)}</li>)}</ul></div>}
          <div>
            <h4>Imprevistos</h4>
            {t.events.length ? <ul>{t.events.map((e, i) => <li key={i}><b>Dia {e.day} · {IMP[e.kind].title}.</b> {e.text}</li>)}</ul> : <p>Nenhum.</p>}
          </div>
          <div><h4><Hand size={15} /> Trabalho em equipe</h4><p>{t.helps} {t.helps === 1 ? 'ajuda' : 'ajudas'} entre colegas.</p></div>
        </div>
      )}
    </article>
  );
}

/** tela do professor no fim da rodada: revela da última para a primeira, uma por vez */
export function Reveal({ v }: { v: St }) {
  const room = v.room!, res = v.results;
  const client = clientById(res?.clientId ?? room.clientId);
  const teams = res?.teams ?? [];
  const n = teams.length;
  const [step, setStep] = useState(room.revealed ? n : 0);
  const [party, setParty] = useState(0);
  const sent = useRef(room.revealed);
  const done = step >= n;

  useEffect(() => {
    if (done) {
      if (!sent.current) { sent.current = true; void call('prof:reveal'); }
      setParty((x) => x + 1); sfx.win();
      return;
    }
    const t = setTimeout(() => { setStep((s) => s + 1); }, step === 0 ? 1200 : 3400);
    return () => clearTimeout(t);
  }, [step, done]);
  useEffect(() => { if (step > 0 && !done) sfx.reveal(); }, [step, done]);

  const next = async () => { const r = await call('prof:start'); if (!r.ok) toast(r.err ?? 'Não deu para começar', 'bad'); };
  const lobby = async () => { await call('prof:lobby'); };
  const setNext = (id: string) => call('prof:settings', { next: id });

  if (!res) return <main className="center-page"><p>Calculando o resultado…</p></main>;
  const cur = !done && step > 0 ? teams[n - step] : null;
  const curPos = n - step + 1;
  const winner = teams[0];

  return (
    <main className="reveal">
      <Confetti fire={party} />
      <header className="rv-head">
        <Logo />
        <div><span className="kicker">Rodada {res.round} · {client.name}</span><h1>{done ? 'Ranking da rodada' : 'Quem atendeu melhor o cliente?'}</h1></div>
        {!done && <button className="btn" onClick={() => setStep(n)}><SkipForward size={17} /> Pular</button>}
      </header>

      {!done && (
        <section className="rv-stage">
          {cur ? (
            <div className="rv-cur" key={cur.id}>
              <span className="rv-place">{curPos}º lugar</span>
              <TeamCard t={cur} pos={curPos} client={client} big />
            </div>
          ) : <p className="rv-wait">Contando os pontos…</p>}
          <ol className="rv-mini" aria-label="Já reveladas">
            {teams.slice(n - step + 1).map((t, i) => (
              <li key={t.id} style={tc(t.color)}><span>{n - step + 2 + i}º</span><b>{t.name}</b><em>{t.pts} pts</em></li>
            ))}
          </ol>
          <button className="btn primary" onClick={() => setStep((s) => s + 1)}>Próxima <ChevronRight size={17} /></button>
        </section>
      )}

      {done && winner && (
        <>
          <section className="podium" aria-label="Pódio">
            {[teams[1], teams[0], teams[2]].map((t, k) => t && (
              <div key={t.id} className={`pd pd-${[2, 1, 3][k]}`} style={tc(t.color)}>
                {k === 1 && <Crown className="crown" size={34} />}
                <b className="pd-name">{t.name}</b>
                <span className="pd-pts">{t.pts} pts</span>
                <div className="pd-block">{[2, 1, 3][k]}º</div>
              </div>
            ))}
          </section>
          <p className="rv-win"><Trophy size={22} /> Equipe <b>{winner.name}</b> venceu a rodada {res.round}!</p>

          <section className="rv-table">
            <table>
              <thead><tr><th>#</th><th>Equipe</th><th>Cartões</th><th>Entrega</th><th>Imprevistos</th><th className="num">Rodada</th><th className="num">Total</th></tr></thead>
              <tbody>
                {teams.map((t, i) => (
                  <tr key={t.id} style={tc(t.color)}>
                    <td className="pos">{i + 1}º</td>
                    <td><span className="swatch" />Equipe {t.name}</td>
                    <td>{t.done}/{t.total}</td>
                    <td>{t.delivered ? `Dia ${t.delivered.day} · ${fmt(t.delivered.ms)}` : 'Não entregou'}</td>
                    <td>{t.events.length}</td>
                    <td className="num"><b>{t.pts}</b></td>
                    <td className="num">{t.acc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rv-summary">
            <h2>Resumo de cada equipe na missão</h2>
            <div className="grid-cards">{teams.map((t, i) => <TeamCard key={t.id} t={t} pos={i + 1} client={client} open />)}</div>
          </section>

          {(v.history?.length ?? 0) > 1 && (
            <section className="rv-hist">
              <h2>Rodadas desta aula</h2>
              <ul>{v.history!.map((h) => <li key={h.round}><b>Rodada {h.round}</b> · {clientById(h.clientId).name} · 1º {h.teams[0]?.name} ({h.teams[0]?.pts} pts)</li>)}</ul>
            </section>
          )}

          <footer className="rv-actions">
            <label className="field inline">
              <span>Próximo cliente</span>
              <select value={room.next} onChange={(e) => setNext(e.target.value)}>
                <option value="random">Sortear</option>
                {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <button className="btn primary lg" onClick={next}>Próxima rodada <ArrowRight size={18} /></button>
            <button className="btn" onClick={lobby}><Home size={17} /> Voltar às equipes</button>
            <button className="btn ghost" onClick={() => leaveRoom(true)}><LogOut size={17} /> Encerrar sala</button>
          </footer>
        </>
      )}
    </main>
  );
}

