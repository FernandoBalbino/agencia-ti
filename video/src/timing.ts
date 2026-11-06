import voice from './voice.json' with { type: 'json' };
import { SCENES } from './script.ts';

export const FPS = 30;
const LEAD = 0.4, TAIL = 0.9; // respiro antes e depois de cada fala (s)
type V = Record<string, { file: string; duration: number; cues: Record<string, number> }>;

// Cena sem áudio ainda: estima pelo tamanho do texto, para dar para montar e prever.
export const plain = (text: string) => text.replace(/\[[^\]]+\]\s*/g, '');
export const estimate = (text: string, cues: Record<string, string>, sec = plain(text).length / 14.5) => {
  const t = plain(text).toLowerCase();
  return {
    duration: sec,
    cues: Object.fromEntries(Object.entries(cues).map(([k, ph]) => [k, (Math.max(0, t.indexOf(ph.split('|')[0].toLowerCase())) / t.length) * sec])),
  };
};

export const TIMELINE = SCENES.map((s) => {
  const v = (voice as V)[s.id];
  const t = v ?? estimate(s.text, s.cues);
  return {
    id: s.id,
    audio: v?.file,
    lead: Math.round(LEAD * FPS),
    dur: Math.ceil((LEAD + t.duration + TAIL) * FPS),
    cues: Object.fromEntries(Object.entries(s.cues).map(([k]) => [k, Math.round((LEAD + (t.cues[k] ?? 0)) * FPS)])),
  };
});
export const TOTAL = TIMELINE.reduce((a, s) => a + s.dur, 0);
