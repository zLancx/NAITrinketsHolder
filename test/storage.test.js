import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function withTempCwd(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trinkets-test-'));
  const prevCwd = process.cwd();
  process.chdir(dir);
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      process.chdir(prevCwd);
      fs.rmSync(dir, { recursive: true, force: true });
    });
}

test('writeTrinket rejects invalid trinkets', async () => {
  await withTempCwd(async () => {
    const storage = await import(`../src/storage.js?cachebust=${Date.now()}-1`);
    assert.throws(() => storage.writeTrinket({}), storage.StorageError);
    assert.throws(() => storage.writeTrinket({ name: 'ok', kind: 'text' }), storage.StorageError);
  });
});

test('writeTrinket rejects duplicate names unless overwrite', async () => {
  await withTempCwd(async () => {
    const storage = await import(`../src/storage.js?cachebust=${Date.now()}-2`);
    const t = { name: 'dup', kind: 'text', prompt: 'hi' };
    storage.writeTrinket(t);
    assert.throws(() => storage.writeTrinket(t), /already exists/);
    assert.doesNotThrow(() => storage.writeTrinket(t, { overwrite: true }));
  });
});

test('writeTrinket rejects unsafe names', async () => {
  await withTempCwd(async () => {
    const storage = await import(`../src/storage.js?cachebust=${Date.now()}-3`);
    assert.throws(() => storage.writeTrinket({ name: '../escape', kind: 'text', prompt: 'x' }), storage.StorageError);
    assert.throws(() => storage.writeTrinket({ name: 'has spaces', kind: 'text', prompt: 'x' }), storage.StorageError);
  });
});

test('findByName returns null for missing or malformed input', async () => {
  await withTempCwd(async () => {
    const storage = await import(`../src/storage.js?cachebust=${Date.now()}-4`);
    assert.equal(storage.findByName('nope'), null);
    assert.equal(storage.findByName(undefined), null);
    assert.equal(storage.findByName(null), null);
  });
});

test('malformed JSON files on disk are skipped, not fatal', async () => {
  await withTempCwd(async () => {
    const storage = await import(`../src/storage.js?cachebust=${Date.now()}-5`);
    storage.ensureDirs();
    const { TEXT_DIR } = storage.paths();
    fs.writeFileSync(path.join(TEXT_DIR, 'broken.json'), '{ not valid json');
    fs.writeFileSync(path.join(TEXT_DIR, 'good.json'), JSON.stringify({ name: 'good', kind: 'text', prompt: 'ok' }));
    storage.invalidateCache();
    const all = [...storage.iterTrinkets()];
    assert.equal(all.length, 1);
    assert.equal(all[0].name, 'good');
  });
});

test('deleteTrinket returns false for unknown name instead of throwing', async () => {
  await withTempCwd(async () => {
    const storage = await import(`../src/storage.js?cachebust=${Date.now()}-6`);
    assert.equal(storage.deleteTrinket('nope'), false);
  });
});

test('renameTrinket rolls back cleanly when target name taken', async () => {
  await withTempCwd(async () => {
    const storage = await import(`../src/storage.js?cachebust=${Date.now()}-7`);
    storage.writeTrinket({ name: 'a', kind: 'text', prompt: 'x' });
    storage.writeTrinket({ name: 'b', kind: 'text', prompt: 'y' });
    assert.throws(() => storage.renameTrinket('a', 'b'), /already exists/);
    assert.ok(storage.findByName('a'));
    assert.ok(storage.findByName('b'));
  });
});

test('cache reflects writes and deletes without stale entries', async () => {
  await withTempCwd(async () => {
    const storage = await import(`../src/storage.js?cachebust=${Date.now()}-8`);
    storage.writeTrinket({ name: 'x', kind: 'text', prompt: 'p' });
    assert.ok(storage.findByName('x'));
    storage.deleteTrinket('x');
    assert.equal(storage.findByName('x'), null);
  });
});
