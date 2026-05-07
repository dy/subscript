// Bitwise operators - eval half
import { operator, compile } from '../../parse.js';

operator('~', a => (a = compile(a), ctx => ~a(ctx)));
operator('|', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) | b(ctx)));
operator('&', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) & b(ctx)));
operator('^', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) ^ b(ctx)));
operator('>>', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) >> b(ctx)));
operator('<<', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) << b(ctx)));
