// Increment/decrement operators - eval half
// b=null means postfix, b=undefined means prefix
import { operator, compile } from '../../parse.js';

const inc = (a, fn, obj, key) =>
  typeof a === 'string' ? ctx => fn(ctx, a) :
  a[0] === '.' ? (obj = compile(a[1]), key = a[2], ctx => fn(obj(ctx), key)) :
  a[0] === '[]' && a.length === 3 ? (obj = compile(a[1]), key = compile(a[2]), ctx => fn(obj(ctx), key(ctx))) :
  a[0] === '()' && a.length === 2 ? inc(a[1], fn) :
  (() => { throw Error('Invalid increment target') })();

operator('++', (a, b) => inc(a, b === null ? (o, k) => o[k]++ : (o, k) => ++o[k]));
operator('--', (a, b) => inc(a, b === null ? (o, k) => o[k]-- : (o, k) => --o[k]));
