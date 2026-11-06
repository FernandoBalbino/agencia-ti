// Mede os áudios em public/voice/sN.mp3 e grava src/voice.json (duração + segundo de cada marca do roteiro).
// Com ELEVENLABS_API_KEY no .env.local da raiz, transcreve as falas para achar cada palavra no tempo exato.
// Sem a chave, distribui as marcas pelo tamanho do texto, dentro da duração real do áudio.
// Uso (dentro de video/): npm run voice [s1 s2 ...]
import { ALL_FORMATS, BufferSource, Input } from 'mediabunny';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { SCENES } from '../src/script.ts';
import { estimate } from '../src/timing.ts';

const DATA = 'src/voice.json';
type Timing = { file: string; duration: number; cues: Record<string, number> };
const data: Record<string, Timing> = existsSync(DATA) ? JSON.parse(readFileSync(DATA, 'utf8')) : {};
const only = process.argv.slice(2);
const KEY = process.env.ELEVENLABS_API_KEY;
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g, '').trim();

async function words(audio: Buffer) {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(audio)], { type: 'audio/mpeg' }), 'fala.mp3');
  form.append('model_id', 'scribe_v1');
  form.append('language_code', 'por');
  form.append('timestamps_granularity', 'word');
  form.append('tag_audio_events', 'false');
  const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': KEY! }, body: form });
  if (!r.ok) throw new Error(`transcrição falhou (${r.status}): ${(await r.text()).slice(0, 160)}`);
  const j = (await r.json()) as { words?: { text: string; start?: number; type?: string }[] };
  return (j.words ?? []).filter((w) => w.type !== 'spacing').map((w) => ({ t: norm(w.text), start: w.start ?? 0 }));
}

let missing = 0;
for (const s of SCENES) {
  const file = `public/voice/${s.id}.mp3`;
  if (only.length && !only.includes(s.id)) continue;
  if (!existsSync(file)) { missing++; delete data[s.id]; continue; }
  const audio = readFileSync(file);
  const duration = await new Input({ formats: ALL_FORMATS, source: new BufferSource(audio) }).computeDuration();
  let cues = estimate(s.text, s.cues, duration).cues;
  let how = 'pelo texto';
  if (KEY) {
    try {
      const ws = words(audio);
      const list = await ws;
      const found: Record<string, number> = {};
      let from = 0;
      for (const [name, phrase] of Object.entries(s.cues)) {
        const alts = phrase.split('|').map((p) => norm(p).split(' '));
        const find = (start: number) => list.findIndex((_, i) => i >= start && alts.some((want) => want.every((p, j) => list[i + j]?.t.startsWith(p))));
        let i = find(from);
        if (i < 0) i = find(0);
        if (i < 0) { console.warn(`  ${s.id}: trecho "${phrase}" não encontrado (fica a estimativa)`); continue; }
        found[name] = +list[i].start.toFixed(3);
        from = i;
      }
      cues = { ...cues, ...found };
      how = `transcrição (${Object.keys(found).length}/${Object.keys(s.cues).length} marcas)`;
    } catch (e) { console.warn(`  ${s.id}: ${(e as Error).message}`); }
  }
  data[s.id] = { file: `voice/${s.id}.mp3`, duration: +duration.toFixed(3), cues: Object.fromEntries(Object.entries(cues).map(([k, v]) => [k, +v.toFixed(3)])) };
  console.log(`${s.id}: ${duration.toFixed(1)} s, marcas ${how}`);
}
writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
if (missing) console.log(`${missing} cena(s) ainda sem áudio em public/voice/ (usam o tempo estimado).`);
