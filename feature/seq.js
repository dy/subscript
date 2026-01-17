/**
 * Sequence operators (C-family)
 *
 * , ; — returns last evaluated value
 */
import { nary, operator, compile } from '../parse.js';

const STATEMENT = 5, SEQ = 10;

// Sequences
nary(',', SEQ);
nary(';', STATEMENT, true);  // right-assoc to allow same-prec statements

// Compile - returns last evaluated value
const seq = (...args) => (args = args.map(compile), ctx => {
  let r;
  for (const arg of args) r = arg(ctx);
  return r;
});
operator(',', seq);
operator(';', seq);
