/**
 * Comparison operators
 *
 * < > <= >=
 */
import { binary, operator, compile } from '../../parse.js';

const COMP = 90;

binary('<', COMP);
binary('>', COMP);
binary('<=', COMP);
binary('>=', COMP);

// Compile
operator('>', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) > b(ctx)));
operator('<', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) < b(ctx)));
operator('>=', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) >= b(ctx)));
operator('<=', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) <= b(ctx)));
