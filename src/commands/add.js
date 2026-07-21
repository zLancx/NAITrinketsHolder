import { spawnSync } from 'node:child_process';
import { writeTrinket, resolveEditor, VALID_KINDS, VALID_MODELS } from '../storage.js';
import { log, err, usageError } from '../output.js';

export function addCmd(args) {
  const name = args._[1];
  if (!name) return usageError('usage: trinkets add <name> --kind text|image --model NAI|SD|... --tags a,b');

  const kind = args.kind || 'text';
  if (!VALID_KINDS.has(kind)) return err(`invalid kind "${kind}", expected one of: ${[...VALID_KINDS].join(', ')}`);

  const model = args.model || 'NAI';
  if (!VALID_MODELS.has(model)) return err(`invalid model "${model}", expected one of: ${[...VALID_MODELS].join(', ')}`);

  const tags = String(args.tags || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const template = {
    name,
    kind,
    model,
    tags,
    prompt: kind === 'image' ? 'masterpiece, best quality, {{subject}}, {{style}}' : 'Write about {{subject}} in a {{tone}} tone.',
    negative_prompt: kind === 'image' ? 'lowres, bad hands' : '',
    params: kind === 'image' ? { sampler: 'k_euler', steps: 28, cfg: 6.5, size: '832x1216' } : {},
    notes: 'edit me',
  };

  let filePath;
  try {
    filePath = writeTrinket(template);
  } catch (e) {
    return err(e.message);
  }

  const editor = resolveEditor();
  if (editor) {
    try {
      spawnSync(editor, [filePath], { stdio: 'inherit' });
    } catch (e) {
      err(`created the file but could not launch editor "${editor}":`, e.message);
    }
  }
  log('created', filePath);
}
