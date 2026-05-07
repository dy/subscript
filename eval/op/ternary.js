// Ternary conditional operator - eval half
import { operator, compile } from '../../parse.js';

operator('?', (a, b, c) => (a = compile(a), b = compile(b), c = compile(c), ctx => a(ctx) ? b(ctx) : c(ctx)));
