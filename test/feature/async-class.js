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

test('async/class: async method shorthand', () => {
  is(parse('class A { async m(a) { await a } }'), [
    'class', 'A', null,
    [':', 'm', ['async', ['=>', ['()', 'a'], ['await', 'a']]]]
  ]);
  is(parse('{ async m(a) { await a } }'), [
    '{}',
    [':', 'm', ['async', ['=>', ['()', 'a'], ['await', 'a']]]]
  ]);
});

test('async/class: await', () => {
  is(parse('await x'), ['await', 'x']);
  is(parse('await f()'), ['await', ['()', 'f', null]]);
  is(parse('await a.b'), ['await', ['.', 'a', 'b']]);
});

test('async/class: compile async function', async () => {
  const ctx = { Promise };

  // Basic async function
  compile(parse('async function f() { return 1 }'))(ctx);
  is(await ctx.f(), 1);

  // Async with return await
  compile(parse('async function g() { return await Promise.resolve(42) }'))(ctx);
  is(await ctx.g(), 42);

  // Async arrow
  const fn = compile(parse('async () => 1'))(ctx);
  is(await fn(), 1);

  // Async arrow with await
  const fn2 = compile(parse('async (x) => await x'))(ctx);
  is(await fn2(Promise.resolve(99)), 99);
});

test.skip('async/class: compile await assignment (BROKEN)', async () => {
  const ctx = { Promise };

  // BUG: await in assignment doesn't work - x becomes Promise, not value
  compile(parse('async function f() { let x = await Promise.resolve(5); return x * 2 }'))(ctx);
  is(await ctx.f(), 10);  // Currently returns NaN

  // BUG: multiple awaits don't work
  compile(parse('async function g() { let a = await Promise.resolve(1); let b = await Promise.resolve(2); return a + b }'))(ctx);
  is(await ctx.g(), 3);  // Currently returns "[object Promise][object Promise]"
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
  is(parse('class A extends ns.B {}'), ['class', 'A', ['.', 'ns', 'B'], null]);
  is(parse('class A extends pick() {}'), ['class', 'A', ['()', 'pick', null], null]);
  is(parse('class A extends (pick()) {}'), ['class', 'A', ['()', ['()', 'pick', null]], null]);
});

test('async/class: anonymous class', () => {
  is(parse('class {}'), ['class', null, null, null]);
  is(parse('class extends B {}'), ['class', null, 'B', null]);
});

test('async/class: static', () => {
  is(parse('static x'), ['static', 'x']);
  is(parse('static x = 1'), ['=', ['static', 'x'], [, 1]]);
  is(parse('class A { static m(a) { return a } }'), [
    'class', 'A', null,
    ['static', [':', 'm', ['=>', ['()', 'a'], ['return', 'a']]]]
  ]);
  is(parse('class A { static ["m"]() { return 1 } }'), [
    'class', 'A', null,
    ['static', [':', ['[]', [, 'm']], ['=>', ['()', null], ['return', [, 1]]]]]
  ]);
  // private static field still works (regression guard)
  is(parse('static #x'), ['static', '#x']);
});

test('async/class: computed members', () => {
  is(parse('class A { ["x"] = 1 }'), [
    'class', 'A', null,
    ['=', ['[]', [, 'x']], [, 1]]
  ]);
  is(parse('class A { ["x"]() { return 1 } }'), [
    'class', 'A', null,
    [':', ['[]', [, 'x']], ['=>', ['()', null], ['return', [, 1]]]]
  ]);
  is(parse('class A { get ["x"]() { return 1 } }'), [
    'class', 'A', null,
    ['get', ['[]', [, 'x']], undefined, ['return', [, 1]]]
  ]);
  is(parse('class A { set ["x"](v) { this.x = v } }'), [
    'class', 'A', null,
    ['set', ['[]', [, 'x']], 'v', ['=', ['.', 'this', 'x'], 'v']]
  ]);
});

test('async/class: super', () => {
  is(parse('super'), 'super');
  is(parse('super.x'), ['.', 'super', 'x']);
  is(parse('super()'), ['()', 'super', null]);
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

test('numbers: decimal member access', () => {
  is(parse('0.95.toFixed(2)'), ['()', ['.', [, 0.95], 'toFixed'], [, 2]]);
});

test('numbers: bigint', () => {
  is(parse('123n'), [, 123n]);
  is(parse('1_000n'), [, 1000n]);
  is(parse('0n'), [, 0n]);
  // prefixed bigint
  is(parse('0xFFn'), [, 0xFFn]);
  is(parse('0o77n'), [, 0o77n]);
  is(parse('0b101n'), [, 0b101n]);
  is(parse('0x1_ABCn'), [, 0x1ABCn]);
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
  // String-literal key — kept as literal node, consistent with `{ "y": 2 }` → [':', [, 'y'], ...]
  is(parse('{ "x/y.js"(exports, module) { module.exports = {} } }'), [
    '{}',
    [':', [, 'x/y.js'], ['=>', ['()', [',', 'exports', 'module']], ['=', ['.', 'module', 'exports'], ['{}', null]]]]
  ]);
  // Evaluation
  const obj = compile(parse('{ double(x) { x * 2 } }'))();
  is(obj.double(5), 10);
});

// === Additional JS statements ===

test('statement: debugger', () => {
  is(parse('debugger'), ['debugger']);
  is(parse('debugger;x'), [';', ['debugger'], 'x']);
});

test('statement: with', () => {
  is(parse('with (obj) x'), ['with', 'obj', 'x']);
  is(parse('with (a.b) { c }'), ['with', ['.', 'a', 'b'], 'c']);
});

test('statement: break/continue label', () => {
  is(parse('break'), ['break']);
  is(parse('break foo'), ['break', 'foo']);
  is(parse('continue'), ['continue']);
  is(parse('continue bar'), ['continue', 'bar']);
  // break followed by keyword should not consume as label
  is(parse('if (x) break else y'), ['if', 'x', ['break'], 'y']);
});

test('statement: label (via colon)', () => {
  // Simple labels work via : binary operator
  is(parse('foo: x'), [':', 'foo', 'x']);
  is(parse('foo: { x }'), [':', 'foo', ['{}', 'x']]);
});

test('generator: method shorthand', () => {
  // { *g() {} } ≡ { g: function* () {} } — value is a function* expression
  is(parse('{ *g() { yield 1 } }'), ['{}', [':', 'g', ['function*', null, null, ['yield', [, 1]]]]]);
  is(parse('{ *gen(a, b) { yield a } }'), ['{}', [':', 'gen', ['function*', null, [',', 'a', 'b'], ['yield', 'a']]]]);
  is(parse('class A { *g() { yield 1 } }'), ['class', 'A', null, [':', 'g', ['function*', null, null, ['yield', [, 1]]]]]);
  is(parse('class A { static *g() { yield 1 } }'), ['class', 'A', null, ['static', [':', 'g', ['function*', null, null, ['yield', [, 1]]]]]]);
  is(parse('{ *[k]() { yield 1 } }'), ['{}', [':', ['[]', 'k'], ['function*', null, null, ['yield', [, 1]]]]]);
  // infix * stays multiplication
  is(parse('a * b'), ['*', 'a', 'b']);
  is(parse('x = a*b * c'), ['=', 'x', ['*', ['*', 'a', 'b'], 'c']]);
});

test('using: declarations (ERM)', () => {
  is(parse('using f = open()'), ['using', ['=', 'f', ['()', 'open', null]]]);
  is(parse('using a = x, b = y'), ['using', ['=', 'a', 'x'], ['=', 'b', 'y']]);
  is(parse('async () => { await using f = open() }'),
    ['async', ['=>', ['()', null], ['{}', ['await', ['using', ['=', 'f', ['()', 'open', null]]]]]]]);
  // contextual: identifier positions untouched
  is(parse('let using = 5'), ['let', ['=', 'using', [, 5]]]);
  is(parse('using = 5'), ['=', 'using', [, 5]]);
  is(parse('using == 5'), ['==', 'using', [, 5]]);
  is(parse('using(x)'), ['()', 'using', 'x']);
  is(parse('({using: 1})'), ['()', ['{}', [':', 'using', [, 1]]]]);
  is(parse('using => using + 1'), ['=>', 'using', ['+', 'using', [, 1]]]);
});

test('switch: statement chains after block (ASI at })', () => {
  is(parse('function f(){ switch (x) { case 1: y } return 1 }'),
    ['function', 'f', null, [';', ['switch', 'x', ['case', [, 1], 'y']], ['return', [, 1]]]]);
});
