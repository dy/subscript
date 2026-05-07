// Range operators - eval half
import { operator, compile } from '../../parse.js';

operator('..', (a, b) => (a = compile(a), b = compile(b), ctx => {
  const start = a(ctx), end = b(ctx), arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}));
operator('..<', (a, b) => (a = compile(a), b = compile(b), ctx => {
  const start = a(ctx), end = b(ctx), arr = [];
  for (let i = start; i < end; i++) arr.push(i);
  return arr;
}));
