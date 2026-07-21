import { iterTrinkets } from '../storage.js';
import { log, usageError } from '../output.js';

export function searchCmd(args) {
  const q = String(args._[1] || '').toLowerCase().trim();
  if (!q) return usageError('usage: trinkets search <term>');

  const hits = [...iterTrinkets()].filter((t) => {
    const { __path, ...rest } = t;
    return JSON.stringify(rest).toLowerCase().includes(q);
  });

  if (hits.length === 0) return log('(no hits)');
  for (const t of hits) log('-', t.name, `[${t.kind}/${t.model}]`, (t.tags || []).join(','));
}
