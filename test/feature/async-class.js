// Tests for async/await, class features, numeric separators, method shorthand
import test, { is, ok } from 'tst';
import { parse, compile } from '../../jessie.js';

test('async/class: async function', () => {
  is(parse('async function f() {}'), ['async', ['function', 'f', null, null]]);
  is(parse('async function f(a) { return a }'), ['async', ['function', 'f', 'a', ['return', 'a']]]);
});

test('async/class: async arrow', () => {
  is(parse('async () => x'), ['async', ['=>', ['()', null], 'x']]);
  is(parse('async x => x'), ['async', ['=>', 'x', 'x']]);
  is(parse('async (a, b) => a + b'), ['async', ['=>', ['()', [',', 'a', 'b']], ['+', 'a', 'b']]]);
});

test('async/class: await', () => {
  is(parse('await x'), ['await', 'x']);
  is(parse('await f()'), ['await', ['()', 'f', null]]);
  is(parse('await a.b'), ['await', ['.', 'a', 'b']]);
});

test('async/class: yield', () => {
  is(parse('yield x'), ['yield', 'x']);
  is(parse('yield* g'), ['yield*', 'g']);
});

test('async/class: generator function', () => {
  is(parse('function* gen() {}'), ['function*', 'gen', null, null]);
  is(parse('function* gen(a) { yield a }'), ['function*', 'gen', 'a', ['yield', 'a']]);
  is(parse('function* () {}'), ['function*', '', null, null]);
  is(parse('function* gen(a, b) { yield a + b }'), ['function*', 'gen', [',', 'a', 'b'], ['yield', ['+', 'a', 'b']]]);
});

test('async/class: class declaration', () => {
  is(parse('class A {}'), ['class', 'A', null, null]);
  is(parse('class A { x }'), ['class', 'A', null, 'x']);
});

test('async/class: class extends', () => {
  is(parse('class A extends B {}'), ['class', 'A', 'B', null]);
  is(parse('class A extends B { x }'), ['class', 'A', 'B', 'x']);
});

test('async/class: anonymous class', () => {
  is(parse('class {}'), ['class', null, null, null]);
  is(parse('class extends B {}'), ['class', null, 'B', null]);
});

test('async/class: static', () => {
  is(parse('static x'), ['static', 'x']);
  is(parse('static x = 1'), ['=', ['static', 'x'], [, 1]]);
});

test('async/class: super', () => {
  is(parse('super'), [, Symbol.for('super')]);
  is(parse('super.x'), ['.', [, Symbol.for('super')], 'x']);
  is(parse('super()'), ['()', [, Symbol.for('super')], null]);
});

test('async/class: private fields', () => {
  is(parse('#x'), '#x');
  is(parse('this.#x'), ['.', 'this', '#x']);
});

test('async/class: for await', () => {
  is(parse('for await (x of y) {}'), ['for await', ['of', 'x', 'y'], null]);
});

test('numbers: numeric separators', () => {
  is(parse('1_000_000'), [, 1000000]);
  is(parse('3.14_15'), [, 3.1415]);
  is(parse('0x1_A_B_C'), [, 0x1ABC]);
  is(parse('0b1111_0000'), [, 0b11110000]);
  is(compile(parse('1_000 + 2_000'))(), 3000);
});

test('numbers: bigint', () => {
  is(parse('123n'), [, 123n]);
  is(parse('1_000n'), [, 1000n]);
  is(parse('0n'), [, 0n]);
});

test('meta: import.meta', () => {
  is(parse('import.meta'), ['import.meta']);
  is(parse('import.meta.url'), ['.', ['import.meta'], 'url']);
});

test('meta: new.target', () => {
  is(parse('new.target'), ['new.target']);
  is(parse('new.target.name'), ['.', ['new.target'], 'name']);
});

test('object: method shorthand', () => {
  is(parse('{ foo() {} }'), ['{}', [':', 'foo', ['=>', ['()', null], null]]]);
  is(parse('{ add(a, b) { a + b } }'), ['{}', [':', 'add', ['=>', ['()', [',', 'a', 'b']], ['+', 'a', 'b']]]]);
  // Evaluation
  const obj = compile(parse('{ double(x) { x * 2 } }'))();
  is(obj.double(5), 10);
});
