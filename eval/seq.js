// Sequence operators - eval half: returns last evaluated value
import { operator, compile } from '../parse.js';

const seq = (...args) => (args = args.map(compile), ctx => {
  let r;
  for (const arg of args) r = arg(ctx);
  return r;
});
operator(',', seq);
operator(';', seq);
