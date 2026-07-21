import { iterTrinkets, validateTrinket } from '../storage.js';
import { log, err } from '../output.js';

export function validateCmd() {
  let bad = 0;
  let total = 0;
  for (const t of iterTrinkets()) {
    total++;
    const errors = validateTrinket(t);
    if (errors.length) {
      bad++;
      err(`${t.name || t.__path}:`, errors.join('; '));
    }
  }
  if (bad === 0) log(`all ${total} trinket(s) valid`);
  else err(`${bad}/${total} invalid trinket(s)`);
}
