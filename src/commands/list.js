import { iterTrinkets } from '../storage.js';
import { log, pad } from '../output.js';

function filterTrinkets({ tag, model, kind }) {
  const wantTag = tag && String(tag).toLowerCase();
  const wantModel = model && String(model).toLowerCase();
  const wantKind = kind && String(kind).toLowerCase();

  return [...iterTrinkets()].filter((t) => {
    const tags = (t.tags || []).map((x) => String(x).toLowerCase());
    if (wantTag && !tags.includes(wantTag)) return false;
    if (wantModel && String(t.model || '').toLowerCase() !== wantModel) return false;
    if (wantKind && String(t.kind || '').toLowerCase() !== wantKind) return false;
    return true;
  });
}

export function listCmd(args) {
  const rows = filterTrinkets(args).sort((a, b) => a.name.localeCompare(b.name));

  if (args.json) {
    log(JSON.stringify(rows.map(({ __path, ...t }) => t), null, 2));
    return;
  }
  if (rows.length === 0) {
    log('(empty)');
    return;
  }

  const widths = [24, 8, 10, 28];
  log(pad('name', widths[0]), pad('kind', widths[1]), pad('model', widths[2]), 'tags');
  for (const t of rows) {
    log(pad(t.name, widths[0]), pad(t.kind || '', widths[1]), pad(t.model || '', widths[2]), (t.tags || []).join(', '));
  }
}
