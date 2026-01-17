/**
 * Logical/nullish assignment operators + destructuring
 *
 * ||= &&= ??= + destructuring support for let/const/var
 */
import { binary, operator, compile } from '../../parse.js';
import { destructure } from '../destruct.js';
import { isLval, prop } from '../member.js';

const ASSIGN = 20;
const err = msg => { throw Error(msg) };

binary('||=', ASSIGN, true);
binary('&&=', ASSIGN, true);
binary('??=', ASSIGN, true);

// Override = to support destructuring
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

// Compile
operator('||=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (o, k, ctx) => o[k] ||= b(ctx))));
operator('&&=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (o, k, ctx) => o[k] &&= b(ctx))));
operator('??=', (a, b) => (isLval(a) || err('Invalid assignment target'), b = compile(b), prop(a, (o, k, ctx) => o[k] ??= b(ctx))));
