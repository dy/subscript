// Unicode identifier tests — reproducing test262 failures
// All tests here FAIL on current subscript and should PASS once fixed.

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
