/**
 * Arithmetic operators
 *
 * + - * / %
 * Unary: + -
 */
import { binary, unary, operator, compile } from '../../parse.js';

const ADD = 110, MULT = 120, PREFIX = 140;

binary('+', ADD);
binary('-', ADD);
binary('*', MULT);
binary('/', MULT);
binary('%', MULT);

unary('+', PREFIX);
unary('-', PREFIX);

// Compile
operator('+', (a, b) => b !== undefined ?
  (a = compile(a), b = compile(b), ctx => a(ctx) + b(ctx)) :
  (a = compile(a), ctx => +a(ctx)));
operator('-', (a, b) => b !== undefined ?
  (a = compile(a), b = compile(b), ctx => a(ctx) - b(ctx)) :
  (a = compile(a), ctx => -a(ctx)));
operator('*', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) * b(ctx)));
operator('/', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) / b(ctx)));
operator('%', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) % b(ctx)));
