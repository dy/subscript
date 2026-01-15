/**
 * Operators - all common operators in one file
 *
 * Includes: arithmetic, comparison, logical, bitwise, assignment, ternary,
 * increment/decrement, arrow, spread, optional chaining, etc.
 *
 * NOTE: Operators sharing prefix chars must be registered shortest-first,
 * so longer ones are tried first in the lookup chain.
 */
import { binary, unary, token, expr, skip, space, parse, cur, idx, next, literal } from '../parse/pratt.js';

// Precedence levels (ref: MDN operator precedence)
const SEQ = 10, ASSIGN = 20, LOR = 30, LAND = 40, OR = 50, XOR = 60, AND = 70;
const EQ = 80, COMP = 90, SHIFT = 100, ADD = 110, MULT = 120, EXP = 130;
const PREFIX = 140, POSTFIX = 150, ACCESS = 170;

// --- Assignment (registered first so longer ops like === are checked first) ---
binary('=', ASSIGN, true);
binary('|', OR);        // before |=, ||, ||=
binary('&', AND);       // before &=, &&, &&=
binary('^', XOR);       // before ^=
binary('!', PREFIX);    // before !=, !==
unary('!', PREFIX);

// --- Comparison (after ! so !== works) ---
binary('<', COMP);      // before <=, <<, <<=
binary('>', COMP);      // before >=, >>, >>=, >>>
binary('==', EQ);       // after =
binary('!=', EQ);       // after !
binary('===', EQ);      // after ==
binary('!==', EQ);      // after !=
binary('in', COMP);
binary('of', COMP);
binary('instanceof', COMP);
binary('<=', COMP);
binary('>=', COMP);

// --- Logical ---
binary('||', LOR);      // after |
binary('&&', LAND);     // after &
binary('??', LOR);

// --- Bitwise shifts ---
binary('>>', SHIFT);    // after >
binary('<<', SHIFT);    // after <
binary('>>>', SHIFT);   // after >>

// --- Arithmetic ---
// NOTE: Register base operators FIRST (tried last), longer variants AFTER (tried first)
// Lookup chain is LIFO: last registered = tried first
binary('+', ADD);       // 1-char, tried last
binary('-', ADD);       // 1-char, tried last
binary('*', MULT);      // 1-char, tried last
binary('/', MULT);
binary('%', MULT);

// --- Compound Assignment (longer operators, tried earlier) ---
binary('+=', ASSIGN, true);  // 2-char
binary('-=', ASSIGN, true);  // 2-char
binary('*=', ASSIGN, true);  // 2-char
binary('/=', ASSIGN, true);
binary('%=', ASSIGN, true);
binary('|=', ASSIGN, true);
binary('&=', ASSIGN, true);
binary('^=', ASSIGN, true);
binary('>>=', ASSIGN, true);  // 3-char
binary('<<=', ASSIGN, true);  // 3-char
binary('>>>=', ASSIGN, true); // 4-char
binary('||=', ASSIGN, true);  // 3-char
binary('&&=', ASSIGN, true);  // 3-char
binary('??=', ASSIGN, true);  // 3-char

// Exponentiation (after *)
binary('**', EXP, true);      // 2-char, after *
binary('**=', ASSIGN, true);  // 3-char, after ** and *

unary('+', PREFIX);
unary('-', PREFIX);
unary('~', PREFIX);

// --- Increment / Decrement ---
token('++', POSTFIX, a => a ? ['++', a, null] : ['++', expr(POSTFIX - 1)]);
token('--', POSTFIX, a => a ? ['--', a, null] : ['--', expr(POSTFIX - 1)]);

// --- Ternary ---
token('?', ASSIGN, (a, b, c) => a && (b = expr(ASSIGN - 1)) && next(c => c === 58) && (c = expr(ASSIGN - 1), ['?', a, b, c]));

// --- Arrow ---
binary('=>', ASSIGN, true);

// --- Spread ---
unary('...', PREFIX);

// --- Optional chaining ---
// ?.  a?.b, ?.[  a?.[x], ?.(  a?.(x)
token('?.', ACCESS, (a, b) => {
  if (!a) return;
  const cc = space();
  // Optional call: a?.()
  if (cc === 40) { skip(); return ['?.()', a, expr(0, 41) || null]; }
  // Optional computed: a?.[x]
  if (cc === 91) { skip(); return ['?.[]', a, expr(0, 93)]; }
  // Optional member: a?.b
  b = expr(ACCESS);
  return b ? ['?.', a, b] : void 0;
});

// --- Unary keyword operators ---
unary('typeof', PREFIX);
unary('void', PREFIX);
unary('delete', PREFIX);

// --- new ---
token('new', PREFIX, a => {
  if (a) return;
  space();
  let target;
  if (cur.charCodeAt(idx) === 40) {
    skip();
    target = expr(0, 41);
    if (!target) return;
  } else {
    target = next(parse.id);
    if (!target) return;
    while (space() === 46) { skip(); const p = next(parse.id); if (!p) return; target = ['.', target, p]; }
    while (space() === 91) { skip(); target = ['[]', target, expr(0, 93)]; }
  }
  const args = space() === 40 ? (skip(), expr(0, 41) || null) : null;
  return ['new', target, args];
});

// --- Literals ---
literal('true', true);
literal('false', false);
literal('null', null);
literal('undefined', undefined);
literal('NaN', NaN);
literal('Infinity', Infinity);
