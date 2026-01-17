/**
 * Ternary conditional operator
 *
 * a ? b : c → conditional expression
 *
 * Common in: C, JS, Java, PHP, etc.
 */
import { token, expr, next, operator, compile } from '../../parse.js';

const ASSIGN = 20;

token('?', ASSIGN, (a, b, c) => a && (b = expr(ASSIGN - 1)) && next(c => c === 58) && (c = expr(ASSIGN - 1), ['?', a, b, c]));

// Compile
operator('?', (a, b, c) => (a = compile(a), b = compile(b), c = compile(c), ctx => a(ctx) ? b(ctx) : c(ctx)));
