import { createRoot } from 'react-dom/client';
import './styles.css';

// /slide abre só a aula (vídeo + slides) e não conecta no jogo: só "acorda" o servidor com um /healthz.
const root = createRoot(document.getElementById('root')!);
if (/\/slide\/?$/.test(location.pathname) || location.hash === '#slide') {
  import('./Slides.tsx').then(({ Slides }) => root.render(<Slides />));
} else {
  import('./App.tsx').then(({ App }) => root.render(<App />));
}
