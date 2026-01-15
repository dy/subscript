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
import { lookup, next, parse, idx, seek } from '../parse/pratt.js';
import { operators, compile as jsCompile } from '../compile/js.js';

const units = {};

export const unit = (...names) => names.forEach(name => {
  units[name] = 1;
  operators[name] = val => (val = jsCompile(val), ctx => ({ value: val(ctx), unit: name }));
});

// Wrap number handler to check for unit suffix
const wrapNum = cc => {
  const orig = lookup[cc];
  if (!orig) return;
  lookup[cc] = (a, prec) => {
    const r = orig(a, prec);
    if (!r || r[0] !== undefined) return r;
    const start = idx, u = next(c => parse.id(c) && !(c >= 48 && c <= 57));
    return u && units[u] ? [u, r] : (u && seek(start), r);
  };
};

// Wrap digit and period handlers
for (let i = 48; i <= 57; i++) wrapNum(i);
wrapNum(46);
