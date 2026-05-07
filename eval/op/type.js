// Type operators - eval half (identity in JS)
import { operator, compile } from '../../parse.js';

operator('as', (a, b) => (a = compile(a), ctx => a(ctx)));
operator('is', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) instanceof b(ctx)));
