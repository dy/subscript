// Unicode identifier tests — reproducing test262 failures
//
// State:
//   - Non-ASCII identifier chars (ࡠ, Ω, etc.) → work fine
//   - \u{XXXX} escape syntax → NOT supported (real gap)
//   - \uXXXX legacy escape syntax → NOT supported
//   - test262 files with 8000+ identifiers → stack overflow (scaling, not correctness)

import test, { is, ok, throws } from 'tst'
import { parse, compile } from '../subscript.js'
import '../jessie.js'

// ============================================================================
// \u{XXXX} unicode escape sequences in identifiers
// Spec: https://tc39.es/ecma262/#prod-IdentifierStart
// ============================================================================

test('unicode: \\u{XXXX} escape in identifier (BMP)', () => {
  // \u{0860} should be equivalent to ࡠ
  let err
  try { parse('let \\u{0860} = 1') } catch (e) { err = e }
  // Currently fails with "Unexpected token" — subscript doesn't handle \u{} escapes
  ok(err, `\\u{} escape not supported: ${err?.message?.slice(0, 60)}`)
})

test('unicode: \\uXXXX escape in identifier (legacy)', () => {
  // \u0041 should be 'A' — legacy 4-digit escape
  let err
  try { parse('let \\u0041 = 1') } catch (e) { err = e }
  ok(err, `\\uXXXX escape not supported: ${err?.message?.slice(0, 60)}`)
})

// ============================================================================
// Non-ASCII identifier characters
// ============================================================================

test('unicode: single non-ASCII identifier', () => {
  // Individual non-ASCII chars should parse fine
  const result = parse('let ࡠ = 1')
  is(result[0], 'let', 'non-ASCII identifier parses')
})

test('unicode: non-ASCII identifier in expression', () => {
  const result = parse('ࡠ + ࡡ')
  is(result[0], '+', 'non-ASCII identifiers in expression')
})

// ============================================================================
// for-in with let as identifier (non-strict)
// `for (let in {})` — `let` used as identifier, not declaration
// Currently fails with parse error
// ============================================================================

test('for-in: let as identifier (non-strict)', () => {
  let err
  try { parse('for (let in {}) {}') } catch (e) { err = e }
  ok(err, `for (let in {}) should fail currently: ${err?.message?.slice(0, 60)}`)
})

// ============================================================================
// Scaling: many non-ASCII identifier declarations
// test262 files with 8000+ identifiers blow the parser stack.
// This is a scaling issue, not a correctness bug.
// ============================================================================

test('unicode: many non-ASCII identifiers (scaling)', () => {
  // 5000 non-ASCII identifier declarations blow the parser stack.
  // This reproduces the test262 failures (files with 8000+ identifiers).
  const ids = Array.from({ length: 5000 }, (_, i) => String.fromCharCode(0x0860 + i % 64))
  const code = ids.map(id => `let ${id} = 1`).join('\n')
  let err
  try { parse(code) } catch (e) { err = e }
  ok(err?.message.includes('Maximum call stack'), `5000 non-ASCII ids should overflow: ${err?.message?.slice(0, 60)}`)
})
