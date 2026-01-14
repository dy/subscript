import { token, expr } from '../../src/parse.js';
import { operator, compile } from '../../src/compile.js';
import { PREC_ACCESS, unsafe } from '../../src/const.js';

// a?.[, a?.( - postfix operator
token('?.', PREC_ACCESS, a => a && ['?.', a]);
operator('?.', a => (a = compile(a), ctx => a(ctx) || (() => { })));

// a?.b, a?.() - optional chain operator
token('?.', PREC_ACCESS, (a, b) => a && (b = expr(PREC_ACCESS), !b?.map) && ['?.', a, b]);
operator('?.', (a, b) => b && (a = compile(a), unsafe(b) ? () => undefined : ctx => a(ctx)?.[b]));

// a?.x() - keep context, but watch out a?.()
operator('()', (a, b, container, args, path, optional) => b !== undefined && (a[0] === '?.') && (a[2] || Array.isArray(a[1])) && (
  args = !b ? () => [] :
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(a => a(ctx))) :
      (b = compile(b), ctx => [b(ctx)]),
  !a[2] && (optional = true, a = a[1]),
  a[0] === '[]' && a.length === 3 ? (path = compile(a[2])) : (path = () => a[2]),
  container = compile(a[1]), optional ?
    ctx => { const p = path(ctx); return unsafe(p) ? undefined : container(ctx)?.[p]?.(...args(ctx)); } :
    ctx => { const p = path(ctx); return unsafe(p) ? undefined : container(ctx)?.[p](...args(ctx)); }
));
