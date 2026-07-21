import { log } from './output.js';

export function printHelp() {
  log(`trinkets — holder for prompt/preset trinkets

usage:
  trinkets list [--tag style] [--model NAI] [--kind image] [--json]
  trinkets show <name> [--vars k=v,k2=v2]
  trinkets copy <name> [--vars k=v]
  trinkets export <name> --to out.txt
  trinkets search <term>
  trinkets tags
  trinkets add <name> --kind text|image --model NAI|SD|... --tags a,b
  trinkets edit <name>
  trinkets delete <name> --yes
  trinkets rename <old-name> <new-name>
  trinkets validate
  trinkets import <file.json> [--overwrite]

notes:
  - vars interpolate {{var}} or {{var:default}} in prompt/negative
  - clipboard is best-effort, falls back to printing
`);
}
