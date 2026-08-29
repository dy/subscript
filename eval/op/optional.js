// Optional chaining operators - eval half
import { operator, compile } from '../../parse.js';
import { toKey, unsafeName } from '../access.js';

operator('?.', (a, b) => (a = compile(a), b = toKey(b), unsafeName(b) ? () => undefined : ctx => a(ctx)?.[b]));
operator('?.[]', (a, b) => (a = compile(a), b = compile(b), ctx => {
  const obj = a(ctx);
  if (obj == null) return undefined;
  const key = toKey(b(ctx));
  return unsafeName(key) ? undefined : obj[key];
}));
operator('?.()', (a, b) => {
  const args = !b ? () => [] :
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(arg => arg(ctx))) :
    (b = compile(b), ctx => [b(ctx)]);

  // Preserve whether the member access itself is optional.
  if (a[0] === '.' || a[0] === '?.') {
    const optional = a[0] === '?.', obj = compile(a[1]), key = toKey(a[2]);
    return unsafeName(key) ? () => undefined : optional ?
      ctx => obj(ctx)?.[key]?.(...args(ctx)) :
      ctx => obj(ctx)[key]?.(...args(ctx));
  }
  if ((a[0] === '[]' || a[0] === '?.[]') && a.length === 3) {
    const optional = a[0] === '?.[]', obj = compile(a[1]), key = compile(a[2]);
    return ctx => {
      const value = obj(ctx);
      if (optional && value == null) return undefined;
      const k = toKey(key(ctx));
      return unsafeName(k) ? undefined : value[k]?.(...args(ctx));
    };
  }
  const fn = compile(a);
  return ctx => fn(ctx)?.(...args(ctx));
});
