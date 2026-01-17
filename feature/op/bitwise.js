/**
 * Bitwise operators
 *
 * | & ^ ~ >> << >>>
 */
import { binary, unary, operator, compile } from '../../parse.js';

const OR = 50, XOR = 60, AND = 70, SHIFT = 100, PREFIX = 140;

// Base operators first (tried last in chain)
binary('|', OR);
binary('&', AND);
binary('^', XOR);

// Shifts (after < >)
binary('>>', SHIFT);
binary('<<', SHIFT);
binary('>>>', SHIFT);

// Unary
unary('~', PREFIX);

// Compile
operator('~', a => (a = compile(a), ctx => ~a(ctx)));
operator('|', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) | b(ctx)));
operator('&', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) & b(ctx)));
operator('^', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) ^ b(ctx)));
operator('>>', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) >> b(ctx)));
operator('<<', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) << b(ctx)));
operator('>>>', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) >>> b(ctx)));
