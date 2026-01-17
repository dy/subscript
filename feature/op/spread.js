/**
 * Spread/rest operator
 *
 * ...x → spread in arrays/calls, rest in params
 *
 * Common in: JS, TS, Python (*args), Ruby (*splat)
 */
import { unary, operator, compile } from '../../parse.js';

const PREFIX = 140;

unary('...', PREFIX);

// Compile (for arrays/objects spread)
operator('...', a => (a = compile(a), ctx => Object.entries(a(ctx))));
