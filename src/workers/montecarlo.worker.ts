/* Monte Carlo en segundo plano: 4.000 tiradas del modelo, enviadas por tandas para que el histograma se llene en vivo. */
import { mulberry32, draw, type MCConfig } from '../lib/montecarlo';

self.onmessage = (e: MessageEvent<{ n: number; seed: number; cfg: MCConfig; batch?: number }>) => {
  const { n, seed, cfg, batch = 200 } = e.data;
  const rand = mulberry32(seed);
  let out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(draw(rand, cfg));
    if (out.length === batch || i === n - 1) {
      (self as unknown as Worker).postMessage({ values: out, done: i === n - 1 });
      out = [];
    }
  }
};
