// Switch - eval half
import { operator, compile } from '../parse.js';
import { BREAK } from './loop.js';

operator('switch', (val, ...cases) => {
  val = compile(val);
  if (!cases.length) return ctx => val(ctx);

  cases = cases.map(c => [
    c[0] === 'case' ? compile(c[1]) : null,
    (c[0] === 'case' ? c[2] : c[1])?.[0] === ';'
      ? (c[0] === 'case' ? c[2] : c[1]).slice(1).map(compile)
      : (c[0] === 'case' ? c[2] : c[1]) ? [compile(c[0] === 'case' ? c[2] : c[1])] : []
  ]);

  return ctx => {
    const v = val(ctx);
    let matched = false, r;
    for (const [test, stmts] of cases)
      if (matched || test === null || test(ctx) === v)
        for (matched = true, i = 0; i < stmts.length; i++)
          try { r = stmts[i](ctx); }
          catch (e) { if (e === BREAK) return r; throw e; }
    var i;
    return r;
  };
});
