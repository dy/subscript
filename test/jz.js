// Parser regressions surfaced by jz integration.
// jz consumes the jessie dialect, so these pin subscript AST shapes that the
// compiler depends on without turning parser internals into jz-specific APIs.

import test, { is } from 'tst'
import { parse, compile } from '../subscript.js'
import '../jessie.js'

const run = (code, ctx = {}) => compile(parse(code))(ctx)

test('jz: arrow block vs parenthesized object expression', () => {
  is(parse('x => { y }'), ['=>', 'x', ['{}', 'y']])
  is(parse('x => ({ y })'), ['=>', 'x', ['()', ['{}', 'y']]])
  is(run('(()=>{a})()', { a: 1 }), undefined)
  is(run('(()=>({a}))()', { a: 1 }), { a: 1 })
})

test('jz: ASI separates statement blocks from following access-like forms', () => {
  is(parse('{x;y}[a,b]=rhs'),
    [';', ['{}', [';', 'x', 'y']], ['=', ['[]', [',', 'a', 'b']], 'rhs']])
  is(parse('{x;y}\n[a,b]=rhs'),
    [';', ['{}', [';', 'x', 'y']], ['=', ['[]', [',', 'a', 'b']], 'rhs']])
  is(parse('if (x) { y }\n[a]'), [';', ['if', 'x', 'y'], ['[]', 'a']])
  is(parse('if (x) { y }\n(z)'), [';', ['if', 'x', 'y'], ['()', 'z']])
})

test('jz: adjacent IIFE call survives newline inside function body', () => {
  is(parse('(function n(){\n  return 1\n})()'),
    ['()', ['()', ['function', 'n', null, ['return', [, 1]]]], null])
})

test('jz: arrow block body terminates before next declaration', () => {
  is(parse('let f = () => { return 1 }\nlet a = [1, 2]'),
    [';',
      ['let', ['=', 'f', ['=>', ['()', null], ['{}', ['return', [, 1]]]]]],
      ['let', ['=', 'a', ['[]', [',', [, 1], [, 2]]]]]])
})

test('jz: switch case boundaries terminate case bodies', () => {
  is(parse(`switch (x) {
      case 1:
        a
        b
      case 2:
        c
    }`),
    ['switch', 'x', ['case', [, 1], [';', 'a', 'b']], ['case', [, 2], 'c']])

  is(parse('switch(x){case 1: a; case 2: b; break}'),
    ['switch', 'x', ['case', [, 1], 'a'], ['case', [, 2], [';', 'b', ['break']]]])
})

test('jz: ASI inside case body does not leak into the next case test', () => {
  // case 0 body ends with `;\n` (ASI sets parse.semi=true). The next case test
  // (`1`) and body (`x = 2`) must each start as a fresh expression — without
  // an explicit clear, parse.step's `parse.semi && p >= lvl` short-circuit
  // would refuse to consume them and the case-body loop would spin pushing
  // nulls until RangeError.
  is(parse(`switch (n) {
      case 0: x = 1;
      case 1: x = 2; break;
    }`),
    ['switch', 'n',
      ['case', [, 0], ['=', 'x', [, 1]]],
      ['case', [, 1], [';', ['=', 'x', [, 2]], ['break']]]])
})

test('jz: switch followed by another statement parses both', () => {
  // The original jz repro: an arrow body with `let`/`switch`/`return` where
  // the `;\n` inside the switch's last case leaves parse.semi sticky and
  // breaks subsequent test parsing.
  is(parse(`(n) => {
      let x = 0;
      switch (n) {
        case 0: x = 1;
        case 1: x = 2; break;
      }
      return x;
    }`),
    ['=>', ['()', 'n'], ['{}', [';',
      ['let', ['=', 'x', [, 0]]],
      ['switch', 'n',
        ['case', [, 0], ['=', 'x', [, 1]]],
        ['case', [, 1], [';', ['=', 'x', [, 2]], ['break']]]],
      ['return', 'x']]]])
})

test('jz: multiple statements separated by `;\\n` inside one case body', () => {
  is(parse(`switch (n) {
      case 0:
        a;
        b;
        break;
    }`),
    ['switch', 'n',
      ['case', [, 0], [';', 'a', 'b', ['break']]]])
})

test('jz: labeled control statements preserve the control node', () => {
  is(parse('outer: while(c){ body }'), [':', 'outer', ['while', 'c', 'body']])
  is(parse('outer: while(c) body'), [':', 'outer', ['while', 'c', 'body']])
})

test('jz: trailing commas do not create phantom operands', () => {
  is(parse('{a: 1,}'), ['{}', [':', 'a', [, 1]]])
  is(parse('{a,}'), ['{}', 'a'])
  is(parse('({a,})'), ['()', ['{}', 'a']])
  is(parse('f(a,b,)'), ['()', 'f', [',', 'a', 'b']])
  is(parse('check(1,2,)'), ['()', 'check', [',', [, 1], [, 2]]])
})

test('jz: leading-elision array literals preserve the hole', () => {
  // `[,]` is a 1-element array with a hole (per ES grammar `[Elision]`);
  // without a real lhs, the comma-list shape `[',', null]` must survive
  // rather than collapsing to plain null (which would error in expr).
  is(parse('[,]'), ['[]', [',', null]])
  is(parse('var a = [,]'), ['var', ['=', 'a', ['[]', [',', null]]]])
  is(parse('[,,]'), ['[]', [',', null, null]])
  is(parse('[,1]'), ['[]', [',', null, [, 1]]])
  // Trailing comma after a real value still collapses (`[1,]` is `[1]`).
  is(parse('[1,]'), ['[]', [, 1]])
})

test('jz: escaped identifier spelling survives tokenization', () => {
  const result = parse('let \\u0041BC = 1')
  is(result[0], 'let')
  is(result[1][1], '\\u0041BC')
})
