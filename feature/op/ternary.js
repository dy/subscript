/**
 * Ternary conditional operator
 *
 * a ? b : c → conditional expression
 *
 * Common in: C, JS, Java, PHP, etc.
 */
import { token, expr, next } from '../../parse/pratt.js';

const ASSIGN = 20;

token('?', ASSIGN, (a, b, c) => a && (b = expr(ASSIGN - 1)) && next(c => c === 58) && (c = expr(ASSIGN - 1), ['?', a, b, c]));
