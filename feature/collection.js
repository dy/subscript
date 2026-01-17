/**
 * Collection literals: arrays and objects (Justin feature)
 *
 * [a, b, c]
 * {a: 1, b: 2}
 * {a, b} (shorthand)
 */
import { group, binary, operator, compile, ACC } from '../parse.js';

const ASSIGN = 20, TOKEN = 200;

// [a,b,c]
group('[]', TOKEN);

// {a:1, b:2, c:3}
group('{}', TOKEN);

// a: b (colon operator for object properties)
binary(':', ASSIGN - 1, true);

// Compile
operator('{}', (a, b) => {
  if (b !== undefined) return;
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
operator(':', (a, b) => (b = compile(b), Array.isArray(a) ?
  (a = compile(a), ctx => [[a(ctx), b(ctx)]]) : ctx => [[a, b(ctx)]]));
