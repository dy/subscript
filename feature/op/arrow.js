/**
 * Arrow function operator
 *
 * (a, b) => expr → arrow function
 *
 * Common in: JS, TS, Java, C#, Kotlin, Scala
 */
import { binary, operator, compile } from '../../parse.js';
import { RETURN } from '../control.js';

const ASSIGN = 20;

binary('=>', ASSIGN, true);

// Compile
operator('=>', (a, b) => {
  // Normalize params: () → [], x → [x], (a, b) → [a, b]
  a = a?.[0] === '()' ? a[1] : a;
  const ps = !a ? [] : a[0] === ',' ? a.slice(1) : [a];
  // Check for rest param
  let restIdx = -1, restName = null;
  const last = ps[ps.length - 1];
  if (Array.isArray(last) && last[0] === '...') {
    restIdx = ps.length - 1;
    restName = last[1];
    ps.length--;
  }
  // Arrow body: {} is always block (need parens for object: ({...}))
  // Block body returns undefined unless explicit return
  const isBlock = b?.[0] === '{}';
  b = compile(isBlock ? ['{', b[1]] : b);
  return ctx => (...args) => {
    const l = {};
    ps.forEach((p, i) => l[p] = args[i]);
    if (restName) l[restName] = args.slice(restIdx);
    const fnCtx = new Proxy(l, {
      get: (l, k) => k in l ? l[k] : ctx?.[k],
      set: (l, k, v) => ((k in l ? l : ctx)[k] = v, true),
      has: (l, k) => k in l || (ctx ? k in ctx : false)
    });
    try { const r = b(fnCtx); return isBlock ? undefined : r; }
    catch (e) { if (e === RETURN) return e[0]; throw e; }
  };
});
