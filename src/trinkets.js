#!/usr/bin/env node
import { ensureDirs, StorageError } from './storage.js';
import { COMMANDS } from './commands/index.js';
import { parseArgs } from './args.js';
import { printHelp } from './help.js';
import { err, EXIT_USAGE } from './output.js';

function run(argv) {
  try {
    ensureDirs();
  } catch (e) {
    err('startup failed:', e.message);
    return;
  }

  const args = parseArgs(argv);
  const cmd = args._[0] || 'help';

  if (cmd === 'help' || args.help) {
    printHelp();
    return;
  }

  const handler = COMMANDS[cmd];
  if (!handler) {
    err(`unknown command: ${cmd}`);
    printHelp();
    process.exitCode = EXIT_USAGE;
    return;
  }

  try {
    handler(args);
  } catch (e) {
    if (e instanceof StorageError) err(e.message);
    else err('unexpected error:', e && e.message ? e.message : String(e));
  }
}

process.on('uncaughtException', (e) => {
  err('fatal:', e && e.message ? e.message : String(e));
  process.exit(1);
});

run(process.argv);
