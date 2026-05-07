// Template literals - eval half
import { operator, compile } from '../parse.js';

operator('`', (...parts) => (parts = parts.map(compile), ctx => parts.map(p => p(ctx)).join('')));
operator('``', (tag, ...parts) => {
  tag = compile(tag);
  const strings = [], exprs = [];
  for (const p of parts) {
    if (Array.isArray(p) && p[0] === undefined) strings.push(p[1]);
    else exprs.push(compile(p));
  }
  const strs = Object.assign([...strings], { raw: strings });
  return ctx => tag(ctx)(strs, ...exprs.map(e => e(ctx)));
});
