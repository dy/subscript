// Unicode identifier tests — reproducing test262 failures.
// Some are fixed regressions; the final section tracks current parser gaps.

import test, { is, throws } from 'tst'
import { parse } from '../subscript.js'
import '../jessie.js'

// ============================================================================
// \u{XXXX} unicode escape sequences in identifiers
// Spec: https://tc39.es/ecma262/#prod-IdentifierStart
// ============================================================================

test('unicode: \\u{XXXX} escape in identifier (BMP)', () => {
  const result = parse('let \\u{0860} = 1')
  is(result[0], 'let')
  is(result[1][1], '\\u{0860}')
})

test('unicode: \\u{XXXX} escape in identifier (astral)', () => {
  const result = parse('let \\u{1F600} = 1')
  is(result[0], 'let')
  is(result[1][1], '\\u{1F600}')
})

test('unicode: \\uXXXX legacy 4-digit escape in identifier', () => {
  const result = parse('let \\u0041 = 1')
  is(result[0], 'let')
  is(result[1][1], '\\u0041')
})

test('unicode: invalid identifier escapes reject', () => {
  throws(() => parse('let \\u{} = 1'))
  throws(() => parse('let \\u{XYZ} = 1'))
  throws(() => parse('let \\u{110000} = 1'))
  throws(() => parse('let \\u00_G = 1'))
})

// ============================================================================
// Non-ASCII identifier characters — correctness (these PASS already)
// ============================================================================

test('unicode: single non-ASCII identifier', () => {
  const result = parse('let ࡠ = 1')
  is(result[0], 'let')
})

test('unicode: non-ASCII identifier in expression', () => {
  const result = parse('ࡠ + ࡡ')
  is(result[0], '+')
})

test('unicode: Other_ID_Continue middle dot in identifier', () => {
  // test262/language/identifiers/other_id_continue.js: `var a·;`
  const result = parse('let a· = 1')
  is(result[0], 'let')
  is(result[1][1], 'a·')
})

// ============================================================================
// Scaling: many non-ASCII identifier declarations
// test262 files with 5000+ identifiers blow the parser stack.
// ============================================================================

test('unicode: many non-ASCII identifiers (scaling)', () => {
  const ids = Array.from({ length: 5000 }, (_, i) => String.fromCharCode(0x0860 + i % 64))
  const code = ids.map(id => `let ${id} = 1`).join('\n')
  const result = parse(code)
  is(result[0], ';')
  is(result.length, 5001)
  is(result[1][0], 'let')
  is(result[5000][0], 'let')
})

test('unicode: many test262-style var identifiers (scaling)', () => {
  // test262 generated identifier files use thousands of `var X;` statements.
  const ids = Array.from({ length: 5000 }, (_, i) => String.fromCharCode(0x4e00 + i))
  const code = ids.map(id => `var ${id};`).join('\n')
  const result = parse(code)
  is(result[0], ';')
  is(result.length, 5002)
  is(result[1][0], 'var')
  is(result[5000][0], 'var')
  is(result[5001], null)
})

// ============================================================================
// for-in with let as identifier (non-strict)
// `for (let in {})` — `let` used as identifier, not declaration
// ============================================================================

test('for-in: let as identifier (non-strict)', () => {
  const result = parse('for (let in {}) {}')
  is(result[0], 'for')
  is(result[1][0], 'in')
  is(result[1][1], 'let')
})

// ============================================================================
// `let` as identifier in shorthand-property and other no-declarator contexts.
// test262: expressions/object/let-non-strict-access — `var let = 1; ({let})`.
// ============================================================================

test('let: bare identifier (no declarator)', () => {
  is(parse('let'), 'let')
})

test('let: shorthand object property', () => {
  is(parse('var let = 1; ({let})'), [';', ['var', ['=', 'let', [, 1]]], ['()', ['{}', 'let']]])
})

test('var: bare identifier', () => {
  is(parse('var'), 'var')
})

test('var: single declarator', () => {
  is(parse('var x = 5'), ['var', ['=', 'x', [, 5]]])
})

test('var: bare name (no init)', () => {
  is(parse('var x'), ['var', 'x'])
})

test('var: multi declarators', () => {
  is(parse('var x = 1, y = 2'), ['var', ['=', 'x', [, 1]], ['=', 'y', [, 2]]])
})

test('var: multi bare names', () => {
  is(parse('var x, y'), ['var', 'x', 'y'])
})

test('var: for-in restructured', () => {
  is(parse('for (var x in obj) {}'), ['for', ['in', ['var', 'x'], 'obj'], null])
})

test('let: parenthesized identifier', () => {
  is(parse('(let)'), ['()', 'let'])
})

// ============================================================================
// `default` as identifier outside `export default`.
// test262: expressions/object/ident-name-method-def-default — `{default(){}}`.
// ============================================================================

test('default: bare identifier', () => {
  is(parse('default'), 'default')
})

test('default: object method shorthand', () => {
  // method-def parses as `default: () => null`-shaped colon-pair
  const r = parse('({default(){}})')
  is(r[0], '()')
  is(r[1][0], '{}')
  is(r[1][1][0], ':')
  is(r[1][1][1], 'default')
})

test('default: member access', () => {
  is(parse('a.default'), ['.', 'a', 'default'])
})

test('export default: still works', () => {
  is(parse('export default 1'), ['export', ['default', [, 1]]])
})

// ============================================================================
// String escape decoding — spec-required \xHH and \uHHHH and \u{...} forms.
// test262 fails: expressions/object/covered-ident-name-prop-name-literal-*
// where `obj['break']` lookups need 'break' to decode to 'break'.
// ============================================================================

test('string escape: \\xHH 2-digit hex', () => {
  const result = parse(`'a\\x41b'`)
  is(result, [, 'aAb'])
})

test('string escape: \\uHHHH 4-digit unicode', () => {
  const result = parse(`'bre\\u0061k'`)
  is(result, [, 'break'])
})

test('string escape: \\u{HHHH} braced unicode (BMP)', () => {
  const result = parse(`'a\\u{0041}b'`)
  is(result, [, 'aAb'])
})

test('string escape: \\u{HHHHH} braced unicode (astral)', () => {
  const result = parse(`'\\u{1F600}'`)
  is(result, [, '\u{1F600}'])
})

test('string escape: \\0 null character', () => {
  const result = parse(`'a\\0b'`)
  is(result, [, 'a\0b'])
})

test('string escape: backslash itself', () => {
  const result = parse(`'a\\\\b'`)
  is(result, [, 'a\\b'])
})

test('string escape: line continuation (LF)', () => {
  const result = parse(`'a\\\nb'`)
  is(result, [, 'ab'])
})
