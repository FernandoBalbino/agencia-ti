import { useEffect, useState } from 'react';
import { useView } from './net.ts';
import { Booting, DayBanner, Toasts, Vignette } from './ui.tsx';
import { Join, ProfHome } from './Home.tsx';
import { Student } from './Student.tsx';
import { Teacher } from './Teacher.tsx';
import { cardOf, clientById } from '../shared/clients.ts';

export function App() {
  const v = useView();
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const f = () => setHash(location.hash);
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);

  let screen;
  if (!v.ready) screen = <Booting />;
  else if (!v.room) screen = hash === '#prof' ? <ProfHome /> : <Join />;
  else if (v.prof) screen = <Teacher v={v} />;
  else screen = <Student v={v} />;

  const client = v.room ? clientById(v.room.clientId) : null;
  return (
    <>
      {v.ready && !v.conn && <div className="connbar">Reconectando…</div>}
      {screen}
      <Vignette />
      <DayBanner />
      <Toasts cardTitle={(id) => (client && cardOf(client, id)?.t) || 'um cartão'} />
    </>
  );
}
