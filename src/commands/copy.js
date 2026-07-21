import { findByName } from '../storage.js';
import { renderPrompt, toPairs } from '../render.js';
import { copyToClipboard } from '../clipboard.js';
import { log, err, usageError } from '../output.js';

export function copyCmd(args) {
  const name = args._[1];
  if (!name) return usageError('usage: trinkets copy <name> [--vars k=v,k2=v2]');

  const t = findByName(name);
  if (!t) return err('not found:', name);

  let rendered;
  try {
    rendered = renderPrompt(t, toPairs(args.vars || ''));
  } catch (e) {
    return err('could not render prompt:', e.message);
  }

  const bundle =
    t.kind === 'image'
      ? `PROMPT:\n${rendered.prompt}\n\nNEGATIVE:\n${rendered.negative_prompt || '(none)'}\nPARAMS:\n${JSON.stringify(t.params || {}, null, 2)}`
      : rendered.prompt;

  if (copyToClipboard(bundle)) {
    log('(copied to clipboard)');
  } else {
    log(bundle);
    log('\n(no clipboard tool found; printed instead)');
  }
}
