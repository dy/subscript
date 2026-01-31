// Function declarations and expressions
import { space, next, parse, parens, expr, operator, compile, cur, idx, skip } from '../parse.js';
import { RETURN } from './control.js';
import { keyword, block } from './block.js';

const TOKEN = 200;

keyword('function', TOKEN, () => {
  space();
  // Check for generator: function*
  let generator = false;
  if (cur[idx] === '*') {
    generator = true;
    skip();
    space();
  }
  const name = next(parse.id);
  name && space();
  const node = generator ? ['function*', name, parens() || null, block()] : ['function', name, parens() || null, block()];
  return node;
});

// Compile
operator('function', (name, params, body) => {
  body = body ? compile(body) : () => undefined;
  // Normalize params: null → [], 'x' → ['x'], [',', 'a', 'b'] → ['a', 'b']
  const ps = !params ? [] : params[0] === ',' ? params.slice(1) : [params];
  // Check for rest param
  let restName = null, restIdx = -1;
  const last = ps[ps.length - 1];
  if (Array.isArray(last) && last[0] === '...') {
    restIdx = ps.length - 1;
    restName = last[1];
    ps.length--;
  }
  return ctx => {
    const fn = (...args) => {
      const l = {};
      ps.forEach((p, i) => l[p] = args[i]);
      if (restName) l[restName] = args.slice(restIdx);
      const fnCtx = new Proxy(l, {
        get: (l, k) => k in l ? l[k] : ctx[k],
        set: (l, k, v) => ((k in l ? l : ctx)[k] = v, true),
        has: (l, k) => k in l || k in ctx
      });
      try { return body(fnCtx); }
      catch (e) { if (e === RETURN) return e[0]; throw e; }
    };
    if (name) ctx[name] = fn;
    return fn;
  };
});

// Generator function (parse only, no implementation)
operator('function*', (name, params, body) => {
  throw Error('Generator functions are not supported in evaluation');
});
