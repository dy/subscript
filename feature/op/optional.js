/**
 * Optional chaining operators
 *
 * a?.b → optional member access
 * a?.[x] → optional computed access
 * a?.() → optional call
 *
 * Common in: JS, TS, Swift, Kotlin, C#
 */
import { token, expr, skip, space, operator, compile, unsafe } from '../../parse.js';

const ACCESS = 170;

token('?.', ACCESS, (a, b) => {
  if (!a) return;
  const cc = space();
  // Optional call: a?.()
  if (cc === 40) { skip(); return ['?.()', a, expr(0, 41) || null]; }
  // Optional computed: a?.[x]
  if (cc === 91) { skip(); return ['?.[]', a, expr(0, 93)]; }
  // Optional member: a?.b
  b = expr(ACCESS);
  return b ? ['?.', a, b] : void 0;
});

// Compile
operator('?.', (a, b) => (a = compile(a), unsafe(b) ? () => undefined : ctx => a(ctx)?.[b]));
operator('?.[]', (a, b) => (a = compile(a), b = compile(b), ctx => { const k = b(ctx); return unsafe(k) ? undefined : a(ctx)?.[k]; }));
operator('?.()', (a, b) => {
  const args = !b ? () => [] :
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(arg => arg(ctx))) :
    (b = compile(b), ctx => [b(ctx)]);

  // Handle nested optional chain: a?.method?.() or a?.["method"]?.()
  if (a[0] === '?.') {
    const container = compile(a[1]);
    const prop = a[2];
    return unsafe(prop) ? () => undefined :
      ctx => { const c = container(ctx); return c?.[prop]?.(...args(ctx)); };
  }
  if (a[0] === '?.[]') {
    const container = compile(a[1]);
    const prop = compile(a[2]);
    return ctx => { const c = container(ctx); const p = prop(ctx); return unsafe(p) ? undefined : c?.[p]?.(...args(ctx)); };
  }
  // Handle a?.() where a is a.method or a[method] - need to bind this
  if (a[0] === '.') {
    const obj = compile(a[1]);
    const prop = a[2];
    return unsafe(prop) ? () => undefined :
      ctx => { const o = obj(ctx); return o?.[prop]?.(...args(ctx)); };
  }
  if (a[0] === '[]' && a.length === 3) {
    const obj = compile(a[1]);
    const prop = compile(a[2]);
    return ctx => { const o = obj(ctx); const p = prop(ctx); return unsafe(p) ? undefined : o?.[p]?.(...args(ctx)); };
  }
  const fn = compile(a);
  return ctx => fn(ctx)?.(...args(ctx));
});
