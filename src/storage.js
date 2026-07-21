import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(process.cwd());
const TRINKET_DIR = path.join(ROOT, 'trinkets');
const TEXT_DIR = path.join(TRINKET_DIR, 'text');
const IMAGE_DIR = path.join(TRINKET_DIR, 'image');

export const VALID_KINDS = new Set(['text', 'image']);
export const VALID_MODELS = new Set(['NAI', 'SD', 'SDXL', 'ComfyUI', 'Other']);
const NAME_RE = /^[\w-]+$/;
const MAX_NAME_LENGTH = 128;
const MAX_FILE_BYTES = 1024 * 1024;

let cache = null;

export class StorageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StorageError';
  }
}

export function paths() {
  return { ROOT, TRINKET_DIR, TEXT_DIR, IMAGE_DIR };
}

export function ensureDirs() {
  for (const dir of [TRINKET_DIR, TEXT_DIR, IMAGE_DIR]) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      throw new StorageError(`could not create directory ${dir}: ${e.message}`);
    }
  }
}

export function dirForKind(kind) {
  return kind === 'image' ? IMAGE_DIR : TEXT_DIR;
}

function safeFileName(name) {
  const cleaned = String(name).replace(/[^\w-]+/g, '_').slice(0, MAX_NAME_LENGTH);
  if (!cleaned) throw new StorageError('name produces an empty filename');
  return `${cleaned}.json`;
}

function isInsideDir(filePath, dir) {
  const resolved = path.resolve(filePath);
  const relative = path.relative(dir, resolved);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function readJsonSafe(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_BYTES) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const filtered = raw
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n');
    const parsed = JSON.parse(filtered);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function loadAll() {
  ensureDirs();
  const entries = new Map();
  for (const dir of [TEXT_DIR, IMAGE_DIR]) {
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const filePath = path.join(dir, file);
      const data = readJsonSafe(filePath);
      if (data && typeof data.name === 'string' && data.name) {
        entries.set(data.name, { ...data, __path: filePath });
      }
    }
  }
  return entries;
}

export function getCache({ fresh = false } = {}) {
  if (fresh || !cache) cache = loadAll();
  return cache;
}

export function invalidateCache() {
  cache = null;
}

export function iterTrinkets() {
  return getCache().values();
}

export function findByName(name) {
  if (!name || typeof name !== 'string') return null;
  return getCache().get(name) || null;
}

export function validateTrinket(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return ['trinket must be a plain object'];
  }
  if (!obj.name || typeof obj.name !== 'string') {
    errors.push('missing or invalid name');
  } else if (!NAME_RE.test(obj.name)) {
    errors.push('name must contain only letters, numbers, underscore, or dash');
  } else if (obj.name.length > MAX_NAME_LENGTH) {
    errors.push(`name exceeds ${MAX_NAME_LENGTH} characters`);
  }
  if (!VALID_KINDS.has(obj.kind)) {
    errors.push(`kind must be one of: ${[...VALID_KINDS].join(', ')}`);
  }
  if (obj.model !== undefined && !VALID_MODELS.has(obj.model)) {
    errors.push(`model should be one of: ${[...VALID_MODELS].join(', ')}`);
  }
  if (obj.tags !== undefined && !Array.isArray(obj.tags)) {
    errors.push('tags must be an array');
  } else if (Array.isArray(obj.tags) && obj.tags.some((t) => typeof t !== 'string')) {
    errors.push('all tags must be strings');
  }
  if (!obj.prompt || typeof obj.prompt !== 'string') {
    errors.push('missing or invalid prompt');
  }
  if (obj.negative_prompt !== undefined && typeof obj.negative_prompt !== 'string') {
    errors.push('negative_prompt must be a string');
  }
  if (obj.params !== undefined && (typeof obj.params !== 'object' || Array.isArray(obj.params) || obj.params === null)) {
    errors.push('params must be an object');
  }
  return errors;
}

function atomicWrite(filePath, contents) {
  const dir = path.dirname(filePath);
  const tmpName = `.${path.basename(filePath)}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  const tmpPath = path.join(dir, tmpName);
  try {
    fs.writeFileSync(tmpPath, contents, { mode: 0o600 });
    fs.renameSync(tmpPath, filePath);
  } catch (e) {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {
      /* best effort cleanup */
    }
    throw new StorageError(`failed to write ${filePath}: ${e.message}`);
  }
}

export function writeTrinket(obj, { overwrite = false } = {}) {
  ensureDirs();
  const errors = validateTrinket(obj);
  if (errors.length) throw new StorageError(`invalid trinket: ${errors.join('; ')}`);

  const existing = findByName(obj.name);
  if (existing && !overwrite) {
    throw new StorageError(`a trinket named "${obj.name}" already exists`);
  }

  const targetDir = dirForKind(obj.kind);
  const filePath = path.join(targetDir, safeFileName(obj.name));
  if (!isInsideDir(filePath, TRINKET_DIR)) {
    throw new StorageError('resolved path escapes the trinkets directory');
  }

  const { __path, ...clean } = obj;
  atomicWrite(filePath, JSON.stringify(clean, null, 2));

  if (existing && existing.__path && existing.__path !== filePath) {
    try {
      if (fs.existsSync(existing.__path)) fs.unlinkSync(existing.__path);
    } catch {
      /* old file left behind is non-fatal */
    }
  }

  invalidateCache();
  return filePath;
}

export function deleteTrinket(name) {
  const existing = findByName(name);
  if (!existing) return false;
  try {
    fs.unlinkSync(existing.__path);
  } catch (e) {
    throw new StorageError(`could not delete "${name}": ${e.message}`);
  }
  invalidateCache();
  return true;
}

export function renameTrinket(oldName, newName) {
  const existing = findByName(oldName);
  if (!existing) throw new StorageError(`not found: ${oldName}`);
  if (findByName(newName)) throw new StorageError(`a trinket named "${newName}" already exists`);

  const { __path, ...rest } = existing;
  const newPath = writeTrinket({ ...rest, name: newName }, { overwrite: true });
  try {
    deleteTrinket(oldName);
  } catch (e) {
    try {
      fs.unlinkSync(newPath);
    } catch {
      /* best effort rollback */
    }
    throw e;
  }
  return newPath;
}

export function resolveEditor() {
  const editor = process.env.EDITOR || process.env.VISUAL;
  return editor && editor.trim() ? editor.trim() : null;
}
