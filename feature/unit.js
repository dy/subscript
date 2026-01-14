/**
 * Unit suffixes: 5px, 10rem, 2s, 500ms
 *
 * AST:
 *   5px   → ['px', [,5]]
 *   2.5s  → ['s', [,2.5]]
 *
 * Usage:
 *   import { unit } from 'subscript/feature/unit.js'
 *   unit('px', 'em', 'rem', 's', 'ms')
 */
import { lookup, next, parse, idx, seek } from '../src/parse.js';
import { operator, compile } from '../src/compile.js';
import { PERIOD, _0, _9 } from '../src/const.js';

// Unit registry (object keys as set)
const units = {};

// Register units with default evaluator
export const unit = (...names) => names.forEach(name => {
  units[name] = 1;
  operator(name, val => (val = compile(val), ctx => ({ value: val(ctx), unit: name })));
});

// Wrap number handler to check for unit suffix
const wrap = (cc, orig = lookup[cc]) => orig && (lookup[cc] = (a, prec, r, start, u) =>
  (r = orig(a, prec)) && r[0] === undefined &&
  (start = idx, u = next(c => parse.id(c) && !(c >= 48 && c <= 57))) ?
    units[u] ? [u, r] : (seek(start), r) : r
);

// Wrap all number entry points (0-9 and .)
wrap(PERIOD);
for (let i = _0; i <= _9; i++) wrap(i);
