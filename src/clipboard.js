import { spawnSync } from 'node:child_process';

const CANDIDATES = {
  win32: [['clip', []]],
  darwin: [['pbcopy', []]],
  linux: [
    ['xclip', ['-selection', 'clipboard']],
    ['xsel', ['--clipboard', '--input']],
    ['wl-copy', []],
  ],
};

const SPAWN_TIMEOUT_MS = 3000;

export function copyToClipboard(text) {
  if (typeof text !== 'string' || text.length === 0) return false;

  const candidates = CANDIDATES[process.platform] || CANDIDATES.linux;
  for (const [cmd, args] of candidates) {
    try {
      const result = spawnSync(cmd, args, {
        input: text,
        stdio: ['pipe', 'ignore', 'ignore'],
        timeout: SPAWN_TIMEOUT_MS,
      });
      if (!result.error && result.status === 0) return true;
    } catch {
      continue;
    }
  }
  return false;
}
