// Sons curtos sintetizados no navegador (sem arquivos para baixar). Só tocam depois de um clique.
let ac: AudioContext | null = null;
let on = true;
export const setSound = (v: boolean) => { on = v; };
export const soundOn = () => on;

function tone(f: number, d: number, type: OscillatorType = 'sine', when = 0, vol = 0.06) {
  if (!on) return;
  try {
    ac ??= new AudioContext();
    if (ac.state === 'suspended') void ac.resume();
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + when;
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + d + 0.03);
  } catch { /* sem áudio */ }
}

export const sfx = {
  tap: () => tone(620, 0.06, 'triangle', 0, 0.05),
  zap: () => { tone(880, 0.07, 'square', 0, 0.03); tone(1320, 0.06, 'triangle', 0.04, 0.04); },
  done: () => { tone(660, 0.1, 'triangle'); tone(990, 0.16, 'triangle', 0.09); },
  no: () => tone(190, 0.14, 'sawtooth', 0, 0.025),
  imp: () => { for (let i = 0; i < 4; i++) tone(i % 2 ? 560 : 820, 0.17, 'sawtooth', i * 0.17, 0.025); },
  good: () => [660, 880, 1100].forEach((f, i) => tone(f, 0.14, 'triangle', i * 0.08)),
  day: () => { tone(520, 0.12, 'sine'); tone(780, 0.2, 'sine', 0.1); },
  win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.2, 'triangle', i * 0.11, 0.07)),
  reveal: () => tone(300, 0.25, 'sine', 0, 0.05),
};
