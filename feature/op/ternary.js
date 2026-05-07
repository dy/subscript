/**
 * Ternary conditional operator - parse half
 *
 * a ? b : c → conditional expression
 */
import { token, expr, next } from '../../parse.js';

const ASSIGN = 20;

token('?', ASSIGN, (a, b, c) => a && (b = expr(ASSIGN - 1)) && next(c => c === 58) && (c = expr(ASSIGN - 1), ['?', a, b, c]));
