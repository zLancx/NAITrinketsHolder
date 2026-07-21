# NAI Trinket Holder

A tiny cross-platform CLI that acts as a **holder** for all your text + image gen **trinkets** (prompts, negative prompts, parameter presets, notes).
Optimized for NovelAI / SD / ComfyUI users who just want a simple vault with search, tags, and quick copy.

Runs on Node 18+ (no dependencies).

## Install

```bash
npm install
npm link          # optional: exposes the `trinkets` command globally
```

## Usage

```bash
node src/trinkets.js help
```

or, if linked:

```bash
trinkets help
```

## Commands

```
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
```

Variables interpolate `{{var}}` or `{{var:default}}` inside `prompt` / `negative_prompt`.

## Project layout

```
.
├─ trinkets/                 # your data — safe to git commit
│  ├─ text/
│  └─ image/
├─ src/
│  ├─ trinkets.js            # CLI entry point
│  ├─ storage.js             # file-backed store, atomic writes, validation
│  ├─ render.js               # {{var}} interpolation
│  ├─ clipboard.js           # best-effort clipboard copy
│  ├─ args.js                # argv parsing
│  ├─ output.js              # logging + exit codes
│  ├─ help.js
│  └─ commands/               # one file per subcommand
└─ test/                      # node:test suite
```

## Trinket schema (JSON)

```jsonc
{
  "name": "unique_name",
  "kind": "text | image",
  "model": "NAI | SD | SDXL | ComfyUI | Other",
  "tags": ["tag1", "tag2"],
  "prompt": "your main prompt {{var}} or {{var:default}} interpolation is allowed",
  "negative_prompt": "optional",
  "params": {
    "sampler": "k_euler",
    "steps": 28,
    "cfg": 6.5,
    "size": "832x1216"
  },
  "notes": "anything you'd like to remember"
}
```

## Stability notes

- Writes are atomic (write to a temp file, then rename) so a crash mid-write can't corrupt a trinket file.
- Malformed JSON files on disk are skipped, not fatal — the CLI keeps working around them.
- Names are validated and sanitized before touching the filesystem; path traversal is rejected.
- Every command has a matching error path tested in `test/`.
- Run `npm test` to execute the test suite.
