// Tests for async/await and class features
import test from 'node:test';
import assert from 'node:assert';

test('async/class: async function', async () => {
  const { parse } = await import('../../parse/jessie.js');
  assert.deepEqual(parse('async function f() {}'), ['async', ['function', 'f', null, null]]);
  assert.deepEqual(parse('async function f(a) { return a }'), ['async', ['function', 'f', 'a', ['return', 'a']]]);
});

test('async/class: async arrow', async () => {
  const { parse } = await import('../../parse/jessie.js');
  assert.deepEqual(parse('async () => x'), ['async', ['=>', ['()', null], 'x']]);
  assert.deepEqual(parse('async x => x'), ['async', ['=>', 'x', 'x']]);
  assert.deepEqual(parse('async (a, b) => a + b'), ['async', ['=>', ['()', [',', 'a', 'b']], ['+', 'a', 'b']]]);
});

test('async/class: await', async () => {
  const { parse } = await import('../../parse/jessie.js');
  assert.deepEqual(parse('await x'), ['await', 'x']);
  assert.deepEqual(parse('await f()'), ['await', ['()', 'f', null]]);
  assert.deepEqual(parse('await a.b'), ['await', ['.', 'a', 'b']]);
});

test('async/class: class declaration', async () => {
  const { parse } = await import('../../parse/jessie.js');
  assert.deepEqual(parse('class A {}'), ['class', 'A', null, null]);
  assert.deepEqual(parse('class A { x }'), ['class', 'A', null, 'x']);
});

test('async/class: class extends', async () => {
  const { parse } = await import('../../parse/jessie.js');
  assert.deepEqual(parse('class A extends B {}'), ['class', 'A', 'B', null]);
  assert.deepEqual(parse('class A extends B { x }'), ['class', 'A', 'B', 'x']);
});

test('async/class: anonymous class', async () => {
  const { parse } = await import('../../parse/jessie.js');
  assert.deepEqual(parse('class {}'), ['class', null, null, null]);
  assert.deepEqual(parse('class extends B {}'), ['class', null, 'B', null]);
});

test('async/class: super', async () => {
  const { parse } = await import('../../parse/jessie.js');
  assert.deepEqual(parse('super'), [, Symbol.for('super')]);
  assert.deepEqual(parse('super.x'), ['.', [, Symbol.for('super')], 'x']);
  assert.deepEqual(parse('super()'), ['()', [, Symbol.for('super')], null]);
});
