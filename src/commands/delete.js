import { findByName, deleteTrinket } from '../storage.js';
import { log, err, usageError } from '../output.js';

export function deleteCmd(args) {
  const name = args._[1];
  if (!name) return usageError('usage: trinkets delete <name> --yes');

  if (!findByName(name)) return err('not found:', name);
  if (!args.yes) return err(`pass --yes to confirm deletion of "${name}"`);

  try {
    deleteTrinket(name);
  } catch (e) {
    return err(e.message);
  }
  log('deleted', name);
}
