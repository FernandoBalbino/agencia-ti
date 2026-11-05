import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, History, MonitorPlay, Presentation } from 'lucide-react';
import { createRoom, joinRoom, loadHistory } from './net.ts';
import { Logo } from './ui.tsx';
import { clientById } from '../shared/clients.ts';

const BASE = import.meta.env.BASE_URL;

export function Join() {
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get('sala')?.toUpperCase().slice(0, 4) ?? '');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 4) return setErr('O código da sala tem 4 letras');
    if (name.trim().length < 2) return setErr('Digite seu nome');
    setBusy(true); setErr('');
    // pede tela cheia já no clique de entrar (o navegador só deixa depois de um clique)
    document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
    const r = await joinRoom(code, name);
    setBusy(false);
    if (!r.ok) setErr(r.err ?? 'Não deu para entrar');
  };
  return (
    <main className="center-page">
      <form className="join-card" onSubmit={submit}>
        <Logo big />
        <h1>Entrar na agência</h1>
        <p className="muted">Digite o código que aparece no telão e o seu nome.</p>
        <label className="field">
          <span>Código da sala</span>
          <input id="code" className="code-input" value={code} maxLength={4} autoComplete="off" spellCheck={false} placeholder="ABCD"
            onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setErr(''); }} />
        </label>
        <label className="field">
          <span>Seu nome</span>
          <input id="name" value={name} maxLength={20} autoComplete="given-name" placeholder="Como quer aparecer"
            onChange={(e) => { setName(e.target.value); setErr(''); }} />
        </label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn primary lg" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'} <ArrowRight size={18} /></button>
        <a className="link-muted" href="#prof">Sou professor</a>
      </form>
    </main>
  );
}

export function ProfHome() {
  const [err, setErr] = useState('');
  const history = loadHistory().slice(0, 6);
  const create = async () => { const r = await createRoom(); if (!r.ok) setErr(r.err ?? 'Erro ao criar a sala'); };
  return (
    <main className="center-page">
      <div className="join-card wide">
        <Logo big />
        <h1>Painel do professor</h1>
        <p className="muted">Crie a sala, mostre o código no telão e sorteie as equipes. Esta tela é a que vai para a TV.</p>
        <div className="row-btns">
          <button className="btn primary lg" onClick={create}>Criar sala <ArrowRight size={18} /></button>
          <a className="btn lg" href={`${BASE}slide/`}><Presentation size={18} /> Aula e vídeo</a>
        </div>
        {err && <p className="err" role="alert">{err}</p>}
        {history.length > 0 && (
          <section className="hist">
            <h3><History size={16} /> Últimas rodadas neste computador</h3>
            <ul>
              {history.map((h) => (
                <li key={`${h.code}-${h.round}`}>
                  <MonitorPlay size={15} />
                  <span>{new Date(h.at).toLocaleDateString('pt-BR')} · Sala {h.code} · Rodada {h.round}</span>
                  <span className="muted">{clientById(h.clientId).name}</span>
                  <b>{h.teams[0] ? `1º ${h.teams[0].name}` : ''}</b>
                </li>
              ))}
            </ul>
          </section>
        )}
        <a className="link-muted" href="#">Sou aluno</a>
      </div>
    </main>
  );
}
