import { renameTrinket } from '../storage.js';
import { log, err, usageError } from '../output.js';

export function renameCmd(args) {
  const [, oldName, newName] = args._;
  if (!oldName || !newName) return usageError('usage: trinkets rename <old-name> <new-name>');

  try {
    renameTrinket(oldName, newName);
    log(`renamed ${oldName} -> ${newName}`);
  } catch (e) {
    err(e.message);
  }
}
