import { findByName } from '../storage.js';
import { renderPrompt, toPairs, unresolvedVars } from '../render.js';
import { log, err, usageError } from '../output.js';

export function showCmd(args) {
  const name = args._[1] || args._[0];
  if (!name) return usageError('usage: trinkets show <name> [--vars k=v,k2=v2]');

  const t = findByName(name);
  if (!t) return err('not found:', name);

  const vars = toPairs(args.vars || '');
  let rendered;
  try {
    rendered = renderPrompt(t, vars);
  } catch (e) {
    return err('could not render prompt:', e.message);
  }

  const { __path, ...rest } = t;
  log(JSON.stringify({ ...rest, ...rendered }, null, 2));

  const missing = unresolvedVars(t).filter((v) => !Object.prototype.hasOwnProperty.call(vars, v));
  if (missing.length) err(`unresolved vars (no value or default given): ${missing.join(', ')}`);
}
