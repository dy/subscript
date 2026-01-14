/**
 * Operators (C-family): && || & | ^ ~ << >> ++ -- ?: compound assigns
 *
 * C-family operator extensions. Import after feature/op.js
 */
import { binary, unary, token, expr, err, next } from '../../parse/pratt.js';

// Precedence levels (ref: MDN operator precedence)
const ASSIGN = 20, LOR = 30, LAND = 40, OR = 50, XOR = 60, AND = 70;
const SHIFT = 100, PREFIX = 140, POSTFIX = 150, COLON = 58;

// Logical OR, AND (short-circuit)
binary('||', LOR);
binary('&&', LAND);

// Bitwise
unary('~', PREFIX);
binary('|', OR);
binary('&', AND);
binary('^', XOR);

// Shift (must come after < > are registered)
binary('>>', SHIFT);
binary('<<', SHIFT);

// Increment / decrement (postfix if has left operand, prefix otherwise)
token('++', POSTFIX, a => a ? ['++', a, null] : ['++', expr(POSTFIX - 1)]);
token('--', POSTFIX, a => a ? ['--', a, null] : ['--', expr(POSTFIX - 1)]);

// Ternary conditional
token('?', ASSIGN, (a, b, c) => a && (b = expr(ASSIGN - 1)) && next(c => c === COLON) && (c = expr(ASSIGN - 1), ['?', a, b, c]));

// Boolean literals (C has true/false in stdbool.h, most C-family has them)
token('true', 200, a => a ? err() : [, true]);
token('false', 200, a => a ? err() : [, false]);

// Compound assignments
binary('=', ASSIGN, true);
binary('+=', ASSIGN, true);
binary('-=', ASSIGN, true);
binary('*=', ASSIGN, true);
binary('/=', ASSIGN, true);
binary('%=', ASSIGN, true);
binary('|=', ASSIGN, true);
binary('&=', ASSIGN, true);
binary('^=', ASSIGN, true);
binary('>>=', ASSIGN, true);
binary('<<=', ASSIGN, true);
