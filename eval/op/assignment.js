// Assignment operators (C-family) - eval half
import { operator, compile } from '../../parse.js';

// Simple assign helper for x, a.b, a[b], (x)
const assign = (a, fn, obj, key) =>
  typeof a === 'string' ? ctx => fn(ctx, a, ctx) :
  a[0] === '.' ? (obj = compile(a[1]), key = a[2], ctx => fn(obj(ctx), key, ctx)) :
  a[0] === '[]' && a.length === 3 ? (obj = compile(a[1]), key = compile(a[2]), ctx => fn(obj(ctx), key(ctx), ctx)) :
  a[0] === '()' && a.length === 2 ? assign(a[1], fn) :
  (() => { throw Error('Invalid assignment target') })();

const ops = { '=': (o,k,v)=>o[k]=v, '+=': (o,k,v)=>o[k]+=v, '-=': (o,k,v)=>o[k]-=v, '*=': (o,k,v)=>o[k]*=v,
  '/=': (o,k,v)=>o[k]/=v, '%=': (o,k,v)=>o[k]%=v, '|=': (o,k,v)=>o[k]|=v, '&=': (o,k,v)=>o[k]&=v,
  '^=': (o,k,v)=>o[k]^=v, '>>=': (o,k,v)=>o[k]>>=v, '<<=': (o,k,v)=>o[k]<<=v };
for (const op in ops) operator(op, (a, b) => (b = compile(b), assign(a, (o, k, ctx) => ops[op](o, k, b(ctx)))));
