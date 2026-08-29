// Property access - eval half
import { operator, compile } from '../parse.js';

const isObject = value => value != null && (typeof value === 'object' || typeof value === 'function');
// Coerce object keys once and preserve Symbol results.
export const toKey = key => isObject(key) ? Reflect.ownKeys({ [key]: 0 })[0] : key;
export const unsafeName = key => typeof key === 'string' && (key[0] === '_' && key[1] === '_' || key === 'constructor' || key === 'prototype');
export const unsafe = key => unsafeName(toKey(key));
compile.id = node => node === undefined || unsafe(node) ? () => undefined : ctx => ctx?.[node];

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
  return ctx => { const k = toKey(b(ctx)); return unsafeName(k) ? undefined : a(ctx)[k]; };
});
operator('.', (a, b) => (a = compile(a), b = toKey(!b[0] ? b[1] : b), unsafeName(b) ? () => undefined : ctx => a(ctx)[b]));
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
  const guard = callGuard(a);
  return guard < 0 ? () => undefined : call(a, guard ?
    (obj, path, ctx) => (path = toKey(path), unsafeName(path) ? undefined : obj[path](...args(ctx))) :
    (obj, path, ctx) => obj[path](...args(ctx)));
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

// Calls bypass member-read compilation to preserve `this`. Classify the key
// once: -1 blocked, 0 statically safe, 1 dynamic (guard at evaluation time).
const keyGuard = key => isObject(key) ? 1 : unsafeName(key) ? -1 : 0;
const callGuard = (a, op = a?.[0], key = a?.[2]) =>
  typeof a === 'string' ? keyGuard(a) :
  op === '()' && a.length == 2 ? callGuard(a[1]) :
  op === '.' || op === '?.' ? keyGuard(key) :
  (op === '[]' || op === '?.[]') && a.length === 3 ?
    Array.isArray(key) && key[0] == null ? keyGuard(key[1]) : 1 : 0;

// Guard property references used by assignment-style operators too.
export const prop = (a, fn, guard = callGuard(a)) => guard < 0 ? () => undefined : call(a, guard ?
  (obj, key, ctx) => (key = toKey(key), unsafeName(key) ? undefined : fn(obj, key, ctx)) : fn);
