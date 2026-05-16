export * from './personality.ts';
export * from './define.ts';
export * from './set-pieces.ts';
export * from './songs.ts';
export { default as theSweetwright } from './oompa-loompas/the-sweetwright.ts';
export { founder } from './founder.ts';

import { registerOompaLoompas } from './define.ts';
import theSweetwright from './oompa-loompas/the-sweetwright.ts';

export const phase1Characters = registerOompaLoompas([theSweetwright]);
