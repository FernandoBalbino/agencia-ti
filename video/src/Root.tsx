import { Composition } from 'remotion';
import { AgenciaVideo } from './Video';
import { FPS, TOTAL } from './timing';

export const RemotionRoot: React.FC = () => (
  <Composition id="AgenciaTI" component={AgenciaVideo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
);
