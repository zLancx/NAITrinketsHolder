const VAR_RE = /\{\{\s*([\w-]+)(?:\s*:\s*([^}]*?))?\s*\}\}/g;
const MAX_TEMPLATE_LENGTH = 20000;

export function toPairs(str) {
  if (!str || typeof str !== 'string') return {};
  const out = {};
  for (const pair of str.split(',')) {
    if (!pair.includes('=')) continue;
    const [key, ...rest] = pair.split('=');
    const trimmedKey = key.trim();
    if (!trimmedKey) continue;
    out[trimmedKey] = rest.join('=').trim();
  }
  return out;
}

function interpolate(template, vars) {
  if (typeof template !== 'string') return '';
  if (template.length > MAX_TEMPLATE_LENGTH) {
    throw new RangeError('template exceeds maximum allowed length');
  }
  return template.replace(VAR_RE, (_match, key, fallback) => {
    if (vars && Object.prototype.hasOwnProperty.call(vars, key)) return String(vars[key]);
    if (fallback !== undefined) return fallback;
    return `{{${key}}}`;
  });
}

export function renderPrompt(trinket, vars = {}) {
  return {
    prompt: interpolate(trinket?.prompt, vars),
    negative_prompt: interpolate(trinket?.negative_prompt, vars),
  };
}

export function unresolvedVars(trinket) {
  const found = new Set();
  const scan = (str) => {
    if (typeof str !== 'string') return;
    for (const match of str.matchAll(VAR_RE)) {
      if (match[2] === undefined) found.add(match[1]);
    }
  };
  scan(trinket?.prompt);
  scan(trinket?.negative_prompt);
  return [...found];
}
