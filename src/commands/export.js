import fs from 'node:fs';
import path from 'node:path';
import { findByName } from '../storage.js';
import { renderPrompt, toPairs } from '../render.js';
import { log, err, usageError } from '../output.js';

export function exportCmd(args) {
  const name = args._[1];
  const to = args.to || args.out || './export.txt';
  if (!name) return usageError('usage: trinkets export <name> --to out.txt');

  const t = findByName(name);
  if (!t) return err('not found:', name);

  let rendered;
  try {
    rendered = renderPrompt(t, toPairs(args.vars || ''));
  } catch (e) {
    return err('could not render prompt:', e.message);
  }

  const lines = [`# ${t.name}`, `kind: ${t.kind} | model: ${t.model}`, `tags: ${(t.tags || []).join(', ')}`, '', 'PROMPT:', rendered.prompt];
  if (t.negative_prompt) lines.push('\nNEGATIVE:', rendered.negative_prompt);
  if (t.params) lines.push('\nPARAMS:', JSON.stringify(t.params, null, 2));

  const resolved = path.resolve(to);
  try {
    fs.writeFileSync(resolved, lines.join('\n'));
  } catch (e) {
    return err(`could not write to ${resolved}:`, e.message);
  }
  log('wrote', resolved);
}
