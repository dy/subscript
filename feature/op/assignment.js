/**
 * Assignment operators
 *
 * = += -= *= /= %= |= &= ^= >>= <<= >>>= ||= &&= ??=
 * Note: **= is in pow.js (must be with ** for correct parsing)
 */
import { binary, operator, compile, isLval, prop, destructure } from '../../parse.js';

const ASSIGN = 20;
const err = msg => { throw Error(msg) };

// Base assignment
binary('=', ASSIGN, true);

// Compound arithmetic
binary('+=', ASSIGN, true);
binary('-=', ASSIGN, true);
binary('*=', ASSIGN, true);
binary('/=', ASSIGN, true);
binary('%=', ASSIGN, true);
// **= is in pow.js

// Compound bitwise
binary('|=', ASSIGN, true);
binary('&=', ASSIGN, true);
binary('^=', ASSIGN, true);
binary('>>=', ASSIGN, true);
binary('<<=', ASSIGN, true);
binary('>>>=', ASSIGN, true);

// Compound logical
binary('||=', ASSIGN, true);
binary('&&=', ASSIGN, true);
binary('??=', ASSIGN, true);

// Compile
operator('=', (a, b) => {
  // Handle let/const/var declarations: ['=', ['let', pattern], value]
  if (Array.isArray(a) && (a[0] === 'let' || a[0] === 'const' || a[0] === 'var')) {
    const pattern = a[1];
    b = compile(b);
    if (typeof pattern === 'string') return ctx => { ctx[pattern] = b(ctx); };
    return ctx => destructure(pattern, b(ctx), ctx);
  }
  isLval(a) || err('Invalid assignment target');
  return (b = compile(b), prop(a, (obj, path, ctx) => obj[path] = b(ctx)));
});
operator('+=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] += b(ctx))));
operator('-=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] -= b(ctx))));
operator('*=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] *= b(ctx))));
operator('/=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] /= b(ctx))));
operator('%=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] %= b(ctx))));
operator('|=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] |= b(ctx))));
operator('&=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] &= b(ctx))));
operator('^=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] ^= b(ctx))));
operator('>>=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] >>= b(ctx))));
operator('<<=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] <<= b(ctx))));
operator('>>>=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] >>>= b(ctx))));
operator('||=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] ||= b(ctx))));
operator('&&=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] &&= b(ctx))));
operator('??=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (obj, path, ctx) => obj[path] ??= b(ctx))));
