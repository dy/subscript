/**
 * Unit suffixes: 5px, 10rem, 2s, 500ms
 * 
 * AST:
 *   5px   → ['px', [,5]]
 *   2.5s  → ['s', [,2.5]]
 * 
 * Units are postfix operators — idiomatic to subscript's design.
 * Inspired by piezo: https://github.com/dy/piezo
 * 
 * Usage:
 *   import { unit } from 'subscript/feature/unit.js'
 *   unit('px', 'em', 'rem', 's', 'ms')
 */
import * as P from '../src/parse.js'
import { operator, compile } from '../src/compile.js'

const { lookup, next, parse } = P

// Unit registry
const units = new Set

// Register units with default evaluator
export const unit = (...names) => names.forEach(name => {
  units.add(name)
  // Default: return { value, unit } object
  operator(name, val => (val = compile(val), ctx => ({ value: val(ctx), unit: name })))
})

// Wrap number handler to check for unit suffix
const wrapHandler = (charCode) => {
  const original = lookup[charCode]
  if (!original) return
  
  lookup[charCode] = (a, prec) => {
    const result = original(a, prec)
    if (!result) return result
    
    // Only numeric literals (not identifiers)
    if (!Array.isArray(result) || result[0] !== undefined) return result
    
    // Try to consume unit suffix
    const startIdx = P.idx
    const u = next(c => parse.id(c) && !(c >= 48 && c <= 57))
    
    if (u && units.has(u)) return [u, result]
    
    // Not a unit - backtrack
    if (u) P.idx = startIdx
    
    return result
  }
}

// Wrap all number entry points (0-9 and .)
// PERIOD, _0, _9 are from src/const.js
import { PERIOD, _0, _9 } from '../src/const.js'
wrapHandler(PERIOD)
for (let i = _0; i <= _9; i++) wrapHandler(i)
