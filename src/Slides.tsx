import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  AlarmClock, ArrowRight, Ban, CalendarClock, Check, ChevronLeft, ChevronRight, Coffee, Cpu, Hand, KanbanSquare, Lock,
  Maximize, MessageCircle, PackageX, Target, Unlock, UserX, Users, WifiOff, Zap,
} from 'lucide-react';
import { Logo } from './ui.tsx';
import './slides.css';

// Aula: 1º o vídeo do jogo, depois gerenciamento de projetos (Informática Aplicada).
// Passe com ← →, espaço ou o passador de slides. "F" deixa em tela cheia.
const BASE = import.meta.env.BASE_URL;
const d = (i: number) => ({ '--d': i }) as CSSProperties;

const SLIDES: { name: string; body: ReactNode }[] = [
  {
    name: 'Vídeo',
    body: (
      <div className="sl-video anim-pop">
        <video src={`${BASE}video/agencia-ti.mp4`} poster={`${BASE}video/poster.jpg`} controls playsInline preload="metadata" />
      </div>
    ),
  },
  {
    name: 'Gerenciamento de projetos',
    body: (
      <div className="sl-center">
        <span className="sl-kicker anim-up">Informática Aplicada</span>
        <h1 className="sl-h1 anim-up" style={d(1)}>Gerenciamento<br />de projetos</h1>
        <p className="sl-sub anim-up" style={d(2)}>Como uma equipe de TI organiza tarefas e prazos para atender o cliente.</p>
      </div>
    ),
  },
  {
    name: 'O que é um projeto',
    body: (
      <>
        <h2 className="sl-h2 anim-up">O que é um projeto?</h2>
        <div className="sl-cards four">
          {[[Target, 'Objetivo', 'o que o cliente quer'], [CalendarClock, 'Prazo', 'até quando precisa ficar pronto'], [Zap, 'Recursos', 'pessoas, tempo e materiais'], [Users, 'Equipe', 'quem faz cada parte']].map(([I, t, s], k) => {
            const Icon = I as typeof Target;
            return <div key={t as string} className="sl-card anim-up" style={d(k + 1)}><span className="sl-ic"><Icon /></span><b>{t as string}</b><span>{s as string}</span></div>;
          })}
        </div>
        <p className="sl-foot anim-up" style={d(6)}>Abrir a papelaria da Dona Rosa na segunda-feira é um projeto.</p>
      </>
    ),
  },
  {
    name: 'Escopo',
    body: (
      <>
        <h2 className="sl-h2 anim-up">Escopo: fazer o que foi pedido</h2>
        <div className="sl-two">
          <div className="sl-col good anim-left" style={d(1)}>
            <h3><Check /> No pedido</h3>
            <ul>{['Computador do caixa funcionando', 'Wi-Fi com senha', 'Antivírus', 'Planilha de estoque'].map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <div className="sl-col bad anim-right" style={d(2)}>
            <h3><Ban /> Fora do pedido</h3>
            <ul>{['Jogo no PC do caixa', 'Placa de vídeo nova', 'Papel de parede do time'].map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
        <p className="sl-foot anim-up" style={d(4)}>Fazer a mais também gasta tempo e energia da equipe.</p>
      </>
    ),
  },
  {
    name: 'Dividir em tarefas',
    body: (
      <>
        <h2 className="sl-h2 anim-up">Dividir o grande em pequeno</h2>
        <div className="sl-flow">
          <div className="sl-big-task anim-pop" style={d(1)}>“Wi-Fi com senha”</div>
          <ArrowRight className="sl-arrow anim-up" style={d(2)} />
          <ol className="sl-steps">
            {['Ligar o roteador', 'Trocar a senha do Wi-Fi', 'Conectar o PC no Wi-Fi', 'Testar a internet'].map((t, k) => <li key={t} className="anim-left" style={d(k + 3)}><b>{k + 1}</b>{t}</li>)}
          </ol>
        </div>
        <p className="sl-foot anim-up" style={d(8)}>Cada tarefa pequena vira um cartão no quadro.</p>
      </>
    ),
  },
  {
    name: 'Kanban',
    body: (
      <>
        <h2 className="sl-h2 anim-up">Quadro Kanban</h2>
        <div className="sl-kanban">
          {[['A fazer', ['Instalar o antivírus', 'Testar a internet']], ['Fazendo', ['Trocar a senha do Wi-Fi']], ['Pronto', ['Ligar o roteador', 'Ligar e testar o PC']]].map(([col, cards], k) => (
            <div key={col as string} className="sl-kcol anim-up" style={d(k + 1)}>
              <b>{col as string}</b>
              {(cards as string[]).map((c) => <span key={c} className={`sl-kcard ${k === 2 ? 'done' : ''}`}>{c}</span>)}
            </div>
          ))}
        </div>
        <div className="sl-chips anim-up" style={d(5)}>{['Trello', 'Microsoft Planner', 'Google Tarefas', 'Notion'].map((t) => <span key={t} className="sl-chip">{t}</span>)}</div>
        <p className="sl-note anim-up" style={d(6)}><KanbanSquare /> Regra da agência: cada pessoa trabalha em um cartão por vez.</p>
      </>
    ),
  },
  {
    name: 'Ordem certa',
    body: (
      <>
        <h2 className="sl-h2 anim-up">A ordem importa</h2>
        <div className="sl-chain">
          {['Ligar o roteador', 'Trocar a senha', 'Conectar o PC', 'Testar a internet'].map((t, k) => (
            <div key={t} className="sl-link anim-pop" style={d(k * 2 + 1)}>
              {k > 0 && <span className="sl-lock">{k < 2 ? <Unlock /> : <Lock />}</span>}
              <span className={`sl-node ${k < 2 ? 'ok' : ''}`}>{t}</span>
            </div>
          ))}
        </div>
        <p className="sl-big anim-up" style={d(9)}>Não dá para testar a internet antes de conectar o Wi-Fi.<br />No jogo, o cartão com <b>cadeado</b> espera o anterior ficar pronto.</p>
      </>
    ),
  },
  {
    name: 'Recursos e prazo',
    body: (
      <div className="sl-two">
        <div>
          <h2 className="sl-h2 anim-up">Recursos e prazo</h2>
          <ul className="sl-check">
            <li className="anim-up" style={d(1)}><Zap /> <span><b>Energia</b> = horas de trabalho de cada pessoa</span></li>
            <li className="anim-up" style={d(2)}><AlarmClock /> <span><b>Dias</b> = o prazo do cliente</span></li>
            <li className="anim-up" style={d(3)}><Target /> <span>Planejar é decidir <b>onde</b> gastar cada raio</span></li>
          </ul>
        </div>
        <div className="sl-calc anim-pop" style={d(4)}>
          <span>4 pessoas</span><b>×</b><span>2 <Zap /></span><b>=</b><strong>8 <Zap /> por dia</strong>
          <p>O cartão custa 1, 2 ou 3 raios. Quando a barra enche, ele está pronto.</p>
        </div>
      </div>
    ),
  },
  {
    name: 'Imprevistos',
    body: (
      <>
        <h2 className="sl-h2 anim-up">Imprevistos acontecem</h2>
        <div className="sl-cards four">
          {[[UserX, 'Alguém faltou'], [PackageX, 'A peça atrasou'], [Cpu, 'O computador travou'], [WifiOff, 'Queda de energia']].map(([I, t], k) => {
            const Icon = I as typeof Target;
            return <div key={t as string} className="sl-card warn anim-flip" style={d(k + 1)}><span className="sl-ic"><Icon /></span><b>{t as string}</b></div>;
          })}
        </div>
        <p className="sl-big anim-up" style={d(6)}>O que fazer? <b>Replanejar</b> e <b>avisar cedo</b> quem precisa saber.<br /><span className="sl-good"><Coffee /> Às vezes a notícia é boa: o cliente traz café e todo mundo ganha energia.</span></p>
      </>
    ),
  },
  {
    name: 'Comunicação',
    body: (
      <div className="sl-two">
        <div>
          <h2 className="sl-h2 anim-up">Equipe que conversa entrega</h2>
          <ul className="sl-check">
            {['Combinar quem faz cada cartão', 'Pedir ajuda cedo, antes de travar', 'Ajudar quem está atrasado', 'Avisar quando terminar'].map((t, k) => <li key={t} className="anim-up" style={d(k + 1)}><Check /> {t}</li>)}
          </ul>
        </div>
        <div className="sl-tools anim-right" style={d(3)}>
          <h3><MessageCircle /> Colaboração online</h3>
          <p>Quadro compartilhado, chat da equipe, documentos e planilhas editados juntos na nuvem.</p>
          <p className="sl-note"><Hand /> No jogo: botões <b>Ajudar</b> e <b>Pedir ajuda</b>.</p>
        </div>
      </div>
    ),
  },
  {
    name: 'Pontos',
    body: (
      <>
        <h2 className="sl-h2 anim-up">Como a agência pontua</h2>
        <div className="sl-score">
          {[['+10', 'por cartão do pedido pronto'], ['+20', 'se entregar tudo no prazo'], ['+2', 'por raio de energia que sobrar'], ['−5', 'por cartão fora do pedido']].map(([n, t], k) => (
            <div key={t} className={`sl-pt anim-pop ${n.startsWith('−') ? 'neg' : ''}`} style={d(k + 1)}><b>{n}</b><span>{t}</span></div>
          ))}
        </div>
        <p className="sl-foot anim-up" style={d(6)}>No fim de cada rodada, o telão mostra o ranking, equipe por equipe.</p>
      </>
    ),
  },
  {
    name: 'Bora jogar',
    body: (
      <div className="sl-center">
        <div className="anim-pop"><Logo big /></div>
        <p className="sl-big anim-up" style={d(2)}>A agência está aberta!</p>
        <p className="sl-sub anim-up" style={d(3)}>Entrem com o código da sala que aparece no telão.</p>
      </div>
    ),
  },
];

export function Slides() {
  const [i, setI] = useState(0);
  const deck = useRef<HTMLDivElement>(null);
  const go = (n: number) => setI((x) => Math.max(0, Math.min(SLIDES.length - 1, x + n)));
  useEffect(() => {
    document.title = 'Agência TI · Aula';
    // acorda o servidor gratuito enquanto o vídeo passa (uma requisição pequena, sem conectar no jogo)
    const url = import.meta.env.VITE_SERVER_URL;
    if (url) fetch(`${url}/healthz`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
    const f = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLVideoElement && (e.key === ' ' || e.key.startsWith('Arrow'))) return;
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(1); }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
      if (e.key.toLowerCase() === 'f') full();
    };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  }, []);
  const full = () => (document.fullscreenElement ? document.exitFullscreen() : deck.current?.requestFullscreen())?.catch(() => {});
  return (
    <div className="deck" ref={deck}>
      <section className="slide" key={i} aria-label={`${i + 1}. ${SLIDES[i].name}`}>{SLIDES[i].body}</section>
      <nav className="sl-nav">
        <button onClick={() => go(-1)} disabled={i === 0} aria-label="Anterior"><ChevronLeft /></button>
        <span className="sl-dots">{SLIDES.map((s, k) => <i key={s.name} className={k === i ? 'on' : ''} onClick={() => setI(k)} title={s.name} />)}</span>
        <button onClick={() => go(1)} disabled={i === SLIDES.length - 1} aria-label="Próximo"><ChevronRight /></button>
        <button onClick={full} aria-label="Tela cheia"><Maximize size={18} /></button>
      </nav>
    </div>
  );
}
