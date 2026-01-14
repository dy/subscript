/**
 * Function declarations and expressions
 *
 * AST:
 *   function f(a,b) { body }      → ['function', 'f', ['a','b'], body]
 *   function(a,b) { body }        → ['function', null, ['a','b'], body]
 *   function f(a, ...rest) {}     → ['function', 'f', ['a', ['...', 'rest']], body]
 */
import { cur, idx, token, expr, skip, space, err, next, parse } from '../src/parse.js';
import { operator, compile } from '../src/compile.js';
import { PREC_STATEMENT, PREC_TOKEN, OPAREN, CPAREN, OBRACE, CBRACE, COMMA, PERIOD, SEMI } from '../src/const.js';
import { RETURN } from './block.js';

// Parse comma-separated identifiers in parens, supports ...rest
const parseParams = () => {
  cur.charCodeAt(idx) === OPAREN || err('Expected (');
  skip();
  const params = [];
  for (let cc; (cc = space()) !== CPAREN;) {
    // ...rest
    if (cc === PERIOD && cur.charCodeAt(idx + 1) === PERIOD && cur.charCodeAt(idx + 2) === PERIOD) {
      params.push(expr(0));
      space() !== CPAREN && err('Rest parameter must be last');
      break;
    }
    const p = next(parse.id);
    p || err('Expected parameter');
    params.push(p);
    space() === COMMA ? skip() : cur.charCodeAt(idx) !== CPAREN && err('Expected , or )');
  }
  return skip(), params;
};

// Parse { stmts } into single AST node
const parseBlock = () => {
  space() === OBRACE || err('Expected {');
  skip();
  const stmts = [];
  while (space() !== CBRACE) (s => s && stmts.push(s))(expr(PREC_STATEMENT)), space() === SEMI && skip();
  return skip(), stmts.length < 2 ? stmts[0] || null : [';', ...stmts];
};

token('function', PREC_TOKEN, a => {
  if (a) return;
  space();
  const name = cur.charCodeAt(idx) !== OPAREN ? next(parse.id) : null;
  name && space();
  return ['function', name, parseParams(), parseBlock()];
});

// Extract rest param from params array, returns [params, restName, restIdx]
const extractRest = params => {
  const last = params[params.length - 1];
  return Array.isArray(last) && last[0] === '...'
    ? [params.slice(0, -1), last[1], params.length - 1]
    : [params, null, -1];
};

operator('function', (name, params, body) => {
  body = body ? compile(body) : () => undefined;
  const [ps, restName, restIdx] = extractRest(params);

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
      catch (e) { if (e?.type === RETURN) return e.value; throw e; }
    };
    if (name) ctx[name] = fn;
    return fn;
  };
});
