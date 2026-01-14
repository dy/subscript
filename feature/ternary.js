import { token, expr, next } from '../src/parse.js';

const ASSIGN = 20, COLON = 58;

// ?: ternary operator
token('?', ASSIGN, (a, b, c) => a && (b = expr(ASSIGN - 1)) && next(c => c === COLON) && (c = expr(ASSIGN - 1), ['?', a, b, c]));
