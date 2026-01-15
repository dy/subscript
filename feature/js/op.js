/**
 * Operators (JS-specific): === !== ?? ??= ||= &&= >>> >>>= in typeof void delete new
 *
 * JS operator extensions beyond C-family. Import after c/op.js
 */
import { binary, unary, literal, token, expr, skip, space, parse, cur, idx, next } from '../../parse/pratt.js';

// Precedence levels (ref: MDN operator precedence)
const ASSIGN = 20, LOR = 30, EQ = 80, COMP = 90, SHIFT = 100, ACCESS = 170, PREFIX = 140;
const OPAREN = 40;

// Strict equality (JS-specific)
binary('===', EQ);
binary('!==', EQ);

// Nullish coalescing
binary('??', LOR);
binary('??=', ASSIGN, true);

// Logical assignment (ES2021)
binary('||=', ASSIGN, true);
binary('&&=', ASSIGN, true);

// Unsigned right shift (JS-specific, not in C)
binary('>>>', SHIFT);
binary('>>>=', ASSIGN, true);

// in operator (object property check)
binary('in', COMP);

// Unary keyword operators
unary('typeof', PREFIX);
unary('void', PREFIX);
unary('delete', PREFIX);

// new - constructor call: new X(), new X(a,b), new a.b.C()
// Parses target expression at high precedence, stops at ( for args
token('new', PREFIX, a => {
  if (a) return;
  space();
  // Parse target at access precedence (to get new A.B.C but not new A())
  let target = next(parse.id);
  if (!target) return;
  // Handle member chains: new A.B.C, new a[b].c
  while (space() === 46) { // .
    skip();
    const prop = next(parse.id);
    if (!prop) return;
    target = ['.', target, prop];
  }
  // Dynamic member access
  while (space() === 91) { // [
    skip();
    target = ['[]', target, expr(0, 93)];
  }
  // Arguments (optional)
  const args = space() === OPAREN ? (skip(), expr(0, 41) || null) : null;
  return ['new', target, args];
});

// instanceof - prototype chain check
binary('instanceof', COMP);

// JS literals (beyond C-family true/false)
literal('null', null);
literal('undefined', undefined);
literal('NaN', NaN);
literal('Infinity', Infinity);
