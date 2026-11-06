// Partida completa local + prints (nada disso usa o Render).
//   AG_SPEED=12 node server/index.ts         (1 minuto do jogo vira 5 s)
//   npx vite --port 5173                     (ou npm run build && npm run preview)
//   node tests/e2e.mjs [site] [servidor]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { bot, NAMES } from './bots.mjs';

const SITE = process.argv[2] ?? 'http://localhost:5173/';
const SERVER = process.argv[3] ?? 'http://localhost:3001';
const OUT = 'docs/prints';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL });
const vp = { width: 1366, height: 768 }; // Chromebook em tela cheia
async function open(name) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('Fullscreen') && errors.push(`${name}: ${m.text()}`));
  return page;
}
const shot = (page, file) => page.screenshot({ path: `${OUT}/${file}.png` });
const until = async (fn, ms = 60_000) => { const t = Date.now(); while (!(await fn())) { if (Date.now() - t > ms) throw new Error('tempo esgotado'); await sleep(250); } };

// ---- professor cria a sala ----
const prof = await open('prof');
await prof.goto(SITE + '#prof');
await shot(prof, '01-professor-inicio');
await prof.click('text=Criar sala');
await prof.waitForSelector('.big-code');
const code = (await prof.locator('.big-code').innerText()).trim();
console.log('sala', code);

// ---- dois alunos de verdade + robôs ----
async function join(name) {
  const p = await open(name);
  await p.goto(`${SITE}?sala=${code}`);
  await p.fill('#name', name);
  if (name === 'Ana') await shot(p, '02-aluno-entrada');
  await p.click('button:has-text("Entrar")');
  await p.waitForSelector('.wait-card');
  const gate = p.locator('.gate button');
  if (await gate.count()) { await shot(p, '03-aluno-tela-cheia'); await gate.click().catch(() => {}); }
  // no navegador sem tela, a tela cheia pode não funcionar: o teste avisa o servidor como se estivesse
  await p.evaluate(() => document.querySelector('.gate')?.remove());
  return p;
}
const ana = await join('Ana');
const bia = await join('Bia Souza');
const bots = NAMES.slice(1, 12).map((n) => bot(n, { code, server: SERVER, pace: 500 }));
await sleep(1200);
await shot(prof, '04-professor-alunos-entrando');

// ---- professor monta equipes à mão: clicar e escolher, depois arrastar ----
await prof.click('.pool .chip-p:has-text("Ana")');
await prof.click('.pool .chip-p:has-text("Bia Souza")');
await shot(prof, '05a-professor-selecionou-alunos');
await prof.click('.team-col:has-text("Pixel") button:has-text("Colocar")');
await sleep(400);
await prof.locator('.pool .chip-p:has-text("Bruno")').dragTo(prof.locator('.team-col:has-text("Byte")'));
await sleep(400);
if ((await prof.locator('.team-col:has-text("Pixel") .chip-p').count()) !== 2) throw new Error('clique-e-coloca não funcionou');
if ((await prof.locator('.team-col:has-text("Byte") .chip-p').count()) !== 1) throw new Error('arrastar não funcionou');
await shot(prof, '05b-professor-montando-equipes');
await shot(ana, '05c-aluno-ve-a-propria-equipe');
// para a partida de teste, sorteia o resto
await prof.click('button:has-text("Sortear")');
await sleep(500);
await shot(prof, '05-professor-equipes-sorteadas');
await shot(ana, '06-aluno-equipe-pronta');
await prof.click('text=Começar rodada');
await ana.waitForSelector('.board');
await sleep(800);
await shot(ana, '07-aluno-planejamento');
await shot(prof, '08-telao-planejamento');

// Ana arrasta um cartão do banco para "A fazer"
const before = await ana.locator('.col-todo .card').count();
await ana.locator('.bank-row').first().dragTo(ana.locator('section.col-todo'));
await sleep(500);
if ((await ana.locator('.col-todo .card').count()) <= before) throw new Error('arrastar do banco não funcionou');
// e clica num cartão do banco e depois na coluna (sem arrastar)
const n2 = await ana.locator('section.col-todo .card').count();
await ana.locator('.bank-row .bank-t').first().click();
await ana.click('section.col-todo h2');
await sleep(500);
if ((await ana.locator('section.col-todo .card').count()) <= n2) throw new Error('clicar no banco e na coluna não funcionou');

// ---- dia 1 ----
await prof.click('button:has-text("Começar o dia 1")', { timeout: 3000 }).catch(() => {});
await sleep(2800);
await shot(ana, '09-aluno-dia-1');
// Ana clica num cartão liberado e depois na coluna "Fazendo" (sem arrastar)
const free = ana.locator('.col-todo .card:not(.locked):not(.blocked)').first();
if (await free.count()) {
  await free.click({ position: { x: 30, y: 60 } });
  await shot(ana, '09b-aluno-escolheu-cartao');
  await ana.click('section.col-doing h2');
  await sleep(500);
  if (!(await ana.locator('.card.mine').count())) throw new Error('clicar e escolher a coluna não funcionou');
}
const spend = ana.locator('.card.mine button:has-text("Gastar")');
if (await spend.count()) { await spend.click(); await sleep(400); }
await shot(ana, '10-aluno-gastou-energia');
await shot(prof, '11-telao-dia-1');

// ---- imprevisto manual para todas as equipes ----
await prof.click('button:has-text("Imprevisto")');
await prof.selectOption('.imp-pop select >> nth=0', 'all');
await prof.selectOption('.imp-pop select >> nth=1', 'extra');
await shot(prof, '12-professor-soltando-imprevisto');
await prof.click('text=Soltar agora');
await sleep(900);
await shot(prof, '13-telao-vinheta-imprevisto');
await shot(ana, '14-aluno-vinheta-imprevisto');
await sleep(4500);

// ---- deixa os dias correrem até o resultado ----
await until(async () => (await prof.locator('.reveal').count()) > 0, 120_000);
await sleep(1500);
await shot(prof, '15-resultado-revelando');
await shot(ana, '16-aluno-olhe-o-telao');
await until(async () => (await prof.locator('.podium').count()) > 0, 60_000);
await sleep(1500);
await shot(prof, '17-resultado-podio');
await prof.evaluate(() => document.querySelector('.rv-summary')?.scrollIntoView());
await sleep(400);
await shot(prof, '18-resultado-resumo-equipes');
await sleep(800);
await shot(ana, '19-aluno-resultado');

// ---- próxima rodada ----
await prof.click('text=Próxima rodada');
await ana.waitForSelector('.board');
await sleep(600);
await shot(bia, '20-aluno-rodada-2');

bots.forEach((b) => b.stop());
await browser.close();
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros no console');
process.exit(errors.length ? 1 : 0);
