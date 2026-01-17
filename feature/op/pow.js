/**
 * Exponentiation operator
 *
 * ** **=
 *
 * ES2016+, not in classic JS/C
 */
import { binary, operator, compile, isLval, prop } from '../../parse.js';

const EXP = 130, ASSIGN = 20;

binary('**', EXP, true);
binary('**=', ASSIGN, true);

// Compile
operator('**', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) ** b(ctx)));
const err = msg => { throw Error(msg) };
operator('**=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] **= b(ctx))));
