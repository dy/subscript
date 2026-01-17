/**
 * Arrow function operator
 *
 * (a, b) => expr → arrow function
 *
 * Common in: JS, TS, Java, C#, Kotlin, Scala
 */
import { binary, operator, compile } from '../../parse.js';

const ASSIGN = 20;

binary('=>', ASSIGN, true);

// Compile
operator('=>', (a, b) => {
  a = a[0] === '()' ? a[1] : a;
  a = !a ? [] : a[0] === ',' ? a.slice(1) : [a];
  let restIdx = -1, restName = null;
  if (a.length && Array.isArray(a[a.length - 1]) && a[a.length - 1][0] === '...') {
    restIdx = a.length - 1;
    restName = a[restIdx][1];
    a = a.slice(0, -1);
  }
  b = compile(b[0] === '{}' ? b[1] : b);
  return (ctx = null) => {
    ctx = Object.create(ctx);
    return (...args) => {
      a.forEach((p, i) => ctx[p] = args[i]);
      if (restName) ctx[restName] = args.slice(restIdx);
      return b(ctx);
    };
  };
});
