/**
 * Unsigned right shift operators
 *
 * >>> >>>=
 */
import { binary, operator, compile } from '../../parse.js';
import { isLval, prop } from '../access.js';

const ASSIGN = 20, SHIFT = 100;
const err = msg => { throw Error(msg) };

binary('>>>', SHIFT);
binary('>>>=', ASSIGN, true);

// Compile
operator('>>>', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) >>> b(ctx)));
operator('>>>=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (o, k, ctx) => o[k] >>>= b(ctx))));
