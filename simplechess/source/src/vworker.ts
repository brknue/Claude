import { think, VJob } from './vsearch';
self.onmessage = (e: MessageEvent<{ id: number; job: VJob }>) => {
  const { id, job } = e.data;
  let res;
  try { res = think(job); } catch (err) { res = { uci: null, score: 0, depth: 0, nodes: 0, error: String(err) }; }
  (self as any).postMessage({ id, res });
};
