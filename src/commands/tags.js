import { iterTrinkets } from '../storage.js';
import { log } from '../output.js';

export function tagsCmd() {
  const bag = new Map();
  for (const t of iterTrinkets()) {
    for (const tag of t.tags || []) {
      const key = String(tag).toLowerCase();
      bag.set(key, (bag.get(key) || 0) + 1);
    }
  }
  const rows = [...bag.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (rows.length === 0) return log('(no tags yet)');
  for (const [tag, count] of rows) log(tag, 'x', count);
}
