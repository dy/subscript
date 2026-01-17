/**
 * Range operators
 *
 * .. (inclusive range): 1..5 → [1,2,3,4,5]
 * ..< (exclusive range): 1..<5 → [1,2,3,4]
 *
 * Common in: Swift, Kotlin, Rust, Ruby
 */
import { binary, operator, compile } from '../../parse.js';

const COMP = 90;

binary('..', COMP);
binary('..<', COMP);

// Compile
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
