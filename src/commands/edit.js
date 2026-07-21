import { spawnSync } from 'node:child_process';
import { findByName, resolveEditor } from '../storage.js';
import { err, usageError } from '../output.js';

export function editCmd(args) {
  const name = args._[1];
  if (!name) return usageError('usage: trinkets edit <name>');

  const t = findByName(name);
  if (!t) return err('not found:', name);

  const editor = resolveEditor();
  if (!editor) return err('no $EDITOR or $VISUAL set; edit the file directly at', t.__path);

  try {
    spawnSync(editor, [t.__path], { stdio: 'inherit' });
  } catch (e) {
    err(`could not launch editor "${editor}":`, e.message);
  }
}
