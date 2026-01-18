/**
 * Property access: a.b, a[b], a(b), [1,2,3]
 * For private fields (#x), see class.js
 */
import { access, binary, operator, compile } from '../parse.js';

// Block prototype chain attacks
export const unsafe = k => k?.[0] === '_' && k[1] === '_' || k === 'constructor' || k === 'prototype';

const ACCESS = 170;

// a[b]
access('[]', ACCESS);

// a.b
binary('.', ACCESS);

// a(b,c,d), a()
access('()', ACCESS);

// Compile
const err = msg => { throw Error(msg) };
operator('[]', (a, b) => {
  // Array literal: [1,2,3] - b is strictly undefined (AST length 2)
  if (b === undefined) {
    a = !a ? [] : a[0] === ',' ? a.slice(1) : [a];
    a = a.map(a => a == null ? (() => undefined) : a[0] === '...' ? (a = compile(a[1]), ctx => a(ctx)) : (a = compile(a), ctx => [a(ctx)]));
    return ctx => a.flatMap(a => a(ctx));
  }
  // Member access: a[b]
  if (b == null) err('Missing index');
  a = compile(a); b = compile(b);
  return ctx => { const k = b(ctx); return unsafe(k) ? undefined : a(ctx)[k]; };
});
operator('.', (a, b) => (a = compile(a), b = !b[0] ? b[1] : b, unsafe(b) ? () => undefined : ctx => a(ctx)[b]));
operator('()', (a, b) => {
  // Group: (expr) - no second argument means grouping, not call
  if (b === undefined) return a == null ? err('Empty ()') : compile(a);
  // Validate: no sparse arguments in calls
  const hasSparse = n => n?.[0] === ',' && n.slice(1).some(a => a == null || hasSparse(a));
  if (hasSparse(b)) err('Empty argument');
  const args = !b ? () => [] :
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(arg => arg(ctx))) :
    (b = compile(b), ctx => [b(ctx)]);
  // Inline call handling for x(), a.b(), a[b](), (x)()
  return call(a, (obj, path, ctx) => obj[path](...args(ctx)));
});

// Left-value check (valid assignment target)
export const isLval = n =>
  typeof n === 'string' ||
  (Array.isArray(n) && (
    n[0] === '.' || n[0] === '?.' ||
    (n[0] === '[]' && n.length === 3) || n[0] === '?.[]' ||
    (n[0] === '()' && n.length === 2 && isLval(n[1])) ||
    n[0] === '{}'
  ));

// Simple call helper (no optional chaining) - handles x(), a.b(), a[b](), (x)()
const call = (a, fn, obj, path) => (
  a == null ? err('Empty ()') :
  a[0] === '()' && a.length == 2 ? call(a[1], fn) :
  typeof a === 'string' ? ctx => fn(ctx, a, ctx) :
  a[0] === '.' ? (obj = compile(a[1]), path = a[2], ctx => fn(obj(ctx), path, ctx)) :
  a[0] === '?.' ? (obj = compile(a[1]), path = a[2], ctx => { const o = obj(ctx); return o == null ? undefined : fn(o, path, ctx); }) :
  a[0] === '[]' && a.length === 3 ? (obj = compile(a[1]), path = compile(a[2]), ctx => fn(obj(ctx), path(ctx), ctx)) :
  a[0] === '?.[]' ? (obj = compile(a[1]), path = compile(a[2]), ctx => { const o = obj(ctx); return o == null ? undefined : fn(o, path(ctx), ctx); }) :
  (a = compile(a), ctx => fn([a(ctx)], 0, ctx))
);

// Export as prop for backward compatibility with other features
export const prop = call;
