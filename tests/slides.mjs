// Confere a aula em /slide: vídeo carrega, slides passam pelo teclado, sem erros no console.
//   PW_CHANNEL=msedge node tests/slides.mjs [site]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const SITE = process.argv[2] ?? 'http://localhost:5173/';
mkdirSync('docs/prints', { recursive: true });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL });
const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`${SITE}slide/`);
await page.waitForSelector('video');
const dur = await page.evaluate(() => new Promise((r) => {
  const v = document.querySelector('video');
  if (v.readyState >= 1) return r(v.duration);
  v.addEventListener('loadedmetadata', () => r(v.duration), { once: true });
  v.addEventListener('error', () => r(-1), { once: true });
}));
console.log('vídeo:', dur > 0 ? `${dur.toFixed(1)} s` : 'NÃO CARREGOU');
await page.waitForTimeout(800);
await page.screenshot({ path: 'docs/prints/30-aula-video.png' });
for (let i = 1; i < 12; i++) {
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(i === 2 || i === 5 || i === 10 ? 1600 : 250);
  if (i === 2 || i === 5 || i === 10) await page.screenshot({ path: `docs/prints/3${i === 2 ? 1 : i === 5 ? 2 : 3}-aula-slide-${i + 1}.png` });
}
await browser.close();
console.log(errors.length ? `ERROS:\n${errors.join('\n')}` : 'sem erros no console');
process.exit(errors.length || dur <= 0 ? 1 : 0);
