// Arithmetic operators - eval half
import { operator, compile } from '../../parse.js';

operator('+', (a, b) => b !== undefined ?
  (a = compile(a), b = compile(b), ctx => a(ctx) + b(ctx)) :
  (a = compile(a), ctx => +a(ctx)));
operator('-', (a, b) => b !== undefined ?
  (a = compile(a), b = compile(b), ctx => a(ctx) - b(ctx)) :
  (a = compile(a), ctx => -a(ctx)));
operator('*', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) * b(ctx)));
operator('/', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) / b(ctx)));
operator('%', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) % b(ctx)));
