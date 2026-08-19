/**
 * BigInt literals - parse half: 123n, 0xFFn, 0b101n, 1_000n
 *
 * AST (token form, JSON-serializable):
 *   123n  → ['n', '123']
 *   0xFFn → ['n', '0xFF']
 *
 * Not part of any dialect: import 'subscript/feature/bigint.js' to enable.
 * Pair with 'subscript/eval/bigint.js' for runtime.
 */
import { lookup, idx, cur, skip, err } from '../parse.js';

const _n = 110, PERIOD = 46, _0 = 48, _9 = 57, _x = 120;

// Wrap number handler to check for `n` suffix (mirrors feature/unit.js)
const wrapNum = cc => {
  const orig = lookup[cc];
  if (!orig) return;
  lookup[cc] = (a, prec) => {
    const start = idx;
    const r = orig(a, prec);
    if (!r || r[0] !== undefined || cur.charCodeAt(idx) !== _n) return r;
    const digits = cur.slice(start, idx).replace(/_/g, '');
    // integer literals only: 1.5n, 1e3n are invalid (hex digits may contain e/E)
    if ((cur.charCodeAt(start + 1) | 32) !== _x && /[.eE]/.test(digits)) err('Invalid BigInt');
    skip();
    return ['n', digits];
  };
};

// Wrap digit and period handlers
for (let i = _0; i <= _9; i++) wrapNum(i);
wrapNum(PERIOD);
