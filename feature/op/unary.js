/**
 * Unary keyword operators
 *
 * typeof x → type string
 * void x → undefined
 * delete x → remove property
 * new X() → construct instance
 *
 * JS-specific keywords
 */
import { unary, operator, compile } from '../../parse.js';

const PREFIX = 140;

unary('typeof', PREFIX);
unary('void', PREFIX);
unary('delete', PREFIX);
unary('new', PREFIX);

// Compile
operator('typeof', a => (a = compile(a), ctx => typeof a(ctx)));
operator('void', a => (a = compile(a), ctx => (a(ctx), undefined)));
operator('delete', a => {
  if (a[0] === '.') {
    const obj = compile(a[1]), key = a[2];
    return ctx => delete obj(ctx)[key];
  }
  if (a[0] === '[]') {
    const obj = compile(a[1]), key = compile(a[2]);
    return ctx => delete obj(ctx)[key(ctx)];
  }
  return () => true;
});
operator('new', (call) => {
  const target = compile(call?.[0] === '()' ? call[1] : call);
  const args = call?.[0] === '()' ? call[2] : null;
  const argList = !args ? () => [] :
    args[0] === ',' ? (a => ctx => a.map(f => f(ctx)))(args.slice(1).map(compile)) :
    (a => ctx => [a(ctx)])(compile(args));
  return ctx => new (target(ctx))(...argList(ctx));
});
