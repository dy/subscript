// Membership operator - eval half
import { operator, compile } from '../../parse.js';

operator('in', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) in b(ctx)));
