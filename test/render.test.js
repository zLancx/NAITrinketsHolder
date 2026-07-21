import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPrompt, toPairs, unresolvedVars } from '../src/render.js';

test('toPairs parses simple key=value pairs', () => {
  assert.deepEqual(toPairs('a=1,b=2'), { a: '1', b: '2' });
});

test('toPairs ignores malformed segments instead of throwing', () => {
  assert.deepEqual(toPairs('a=1,justkey,b=2'), { a: '1', b: '2' });
});

test('toPairs handles empty and non-string input', () => {
  assert.deepEqual(toPairs(''), {});
  assert.deepEqual(toPairs(undefined), {});
  assert.deepEqual(toPairs(null), {});
});

test('renderPrompt substitutes known vars and leaves unknown ones untouched', () => {
  const t = { prompt: 'hello {{name}}, bye {{other}}' };
  const result = renderPrompt(t, { name: 'Rhea' });
  assert.equal(result.prompt, 'hello Rhea, bye {{other}}');
});

test('renderPrompt applies default values when var not supplied', () => {
  const t = { prompt: 'mood: {{mood:calm}}' };
  assert.equal(renderPrompt(t, {}).prompt, 'mood: calm');
  assert.equal(renderPrompt(t, { mood: 'tense' }).prompt, 'mood: tense');
});

test('renderPrompt tolerates missing trinket fields', () => {
  assert.deepEqual(renderPrompt({}, {}), { prompt: '', negative_prompt: '' });
  assert.deepEqual(renderPrompt(null, {}), { prompt: '', negative_prompt: '' });
});

test('unresolvedVars ignores vars that have a default', () => {
  const t = { prompt: '{{a}} {{b:fallback}}' };
  assert.deepEqual(unresolvedVars(t), ['a']);
});

test('renderPrompt rejects absurdly long templates', () => {
  const huge = { prompt: 'x'.repeat(30000) };
  assert.throws(() => renderPrompt(huge, {}), RangeError);
});
