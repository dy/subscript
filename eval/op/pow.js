// Exponentiation operator - eval half
import { operator, compile } from '../../parse.js';
import { isLval, prop } from '../access.js';

const err = msg => { throw Error(msg) };

operator('**', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) ** b(ctx)));
operator('**=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] **= b(ctx))));
