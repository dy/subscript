// Nullish coalescing operator - eval half
import { operator, compile } from '../../parse.js';

operator('??', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) ?? b(ctx)));
