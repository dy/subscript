// Collection literals - eval half
// Block vs object detection (jessie):
//   ['{}', [';', ...]]     → ['{', body]     block with statements
//   ['{}', ['let', ...]]   → ['{', body]     block with declaration
//   ['{}', null]           → ['{}', null]    empty object {}
//   ['{}', 'a']            → ['{}', 'a']     object shorthand {a}
//   ['{}', [':', k, v]]    → ['{}', ...]     object literal
import { operator, compile } from '../parse.js';
import { ACC } from './accessor.js';

// Object inner: null, string, or array starting with : , ... get set
const isObject = a => a == null || typeof a === 'string' || [':', ',', '...', 'get', 'set'].includes(a[0]);

operator('{}', (a, b) => {
  if (b !== undefined) return;
  // Block: not an object pattern
  if (!isObject(a)) return compile(['{', a]);
  // Object literal
  a = !a ? [] : a[0] !== ',' ? [a] : a.slice(1);
  const props = a.map(p => compile(typeof p === 'string' ? [':', p, p] : p));
  return ctx => {
    const obj = {}, acc = {};
    for (const e of props.flatMap(f => f(ctx))) {
      if (e[0] === ACC) {
        const [, n, desc] = e;
        acc[n] = { ...acc[n], ...desc, configurable: true, enumerable: true };
      } else obj[e[0]] = e[1];
    }
    for (const n in acc) Object.defineProperty(obj, n, acc[n]);
    return obj;
  };
});

// Block statement - creates scope
operator('{', body => {
  body = body ? compile(body) : () => undefined;
  return ctx => body(Object.create(ctx));
});

operator(':', (a, b) => (b = compile(b), Array.isArray(a) ?
  (a = compile(a), ctx => [[a(ctx), b(ctx)]]) : ctx => [[a, b(ctx)]]));
