import fs from 'node:fs';
import path from 'node:path';
import { writeTrinket } from '../storage.js';
import { log, err, usageError } from '../output.js';

const MAX_IMPORT_ITEMS = 500;
const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

export function importCmd(args) {
  const file = args._[1];
  if (!file) return usageError('usage: trinkets import <file.json> [--overwrite]');

  const resolved = path.resolve(file);
  let stat;
  try {
    stat = fs.statSync(resolved);
  } catch (e) {
    return err(`could not access ${resolved}:`, e.message);
  }
  if (stat.size > MAX_IMPORT_FILE_BYTES) {
    return err(`file too large (${stat.size} bytes), max is ${MAX_IMPORT_FILE_BYTES} bytes`);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
  } catch (e) {
    return err('could not parse JSON:', e.message);
  }

  const items = Array.isArray(data) ? data : [data];
  if (items.length > MAX_IMPORT_ITEMS) {
    return err(`too many items (${items.length}), max is ${MAX_IMPORT_ITEMS} per import`);
  }

  let imported = 0;
  for (const item of items) {
    try {
      writeTrinket(item, { overwrite: !!args.overwrite });
      imported++;
    } catch (e) {
      err(`skipped "${item && item.name}":`, e.message);
    }
  }
  log(`imported ${imported}/${items.length}`);
}
