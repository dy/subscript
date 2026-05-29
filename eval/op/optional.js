// Optional chaining operators - eval half
import { operator, compile } from '../../parse.js';
import { unsafe } from '../access.js';

operator('?.', (a, b) => (a = compile(a), unsafe(b) ? () => undefined : ctx => a(ctx)?.[b]));
operator('?.[]', (a, b) => (a = compile(a), b = compile(b), ctx => { const k = b(ctx); return unsafe(k) ? undefined : a(ctx)?.[k]; }));
operator('?.()', (a, b) => {
  const args = !b ? () => [] :
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(arg => arg(ctx))) :
    (b = compile(b), ctx => [b(ctx)]);

  // ?.() always null-short-circuits, so . and ?. produce identical code.
  // The only real distinction is static key vs dynamic key.
  if (a[0] === '.' || a[0] === '?.') {
    const obj = compile(a[1]), key = a[2];
    return unsafe(key) ? () => undefined : ctx => obj(ctx)?.[key]?.(...args(ctx));
  }
  if ((a[0] === '[]' || a[0] === '?.[]') && a.length === 3) {
    const obj = compile(a[1]), key = compile(a[2]);
    return ctx => { const k = key(ctx); return unsafe(k) ? undefined : obj(ctx)?.[k]?.(...args(ctx)); };
  }
  const fn = compile(a);
  return ctx => fn(ctx)?.(...args(ctx));
});
