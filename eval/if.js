// If/else - eval half
import { operator, compile } from '../parse.js';

operator('if', (cond, body, alt) => {
  cond = compile(cond); body = compile(body); alt = alt !== undefined ? compile(alt) : null;
  return ctx => cond(ctx) ? body(ctx) : alt?.(ctx);
});
