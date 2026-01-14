/**
 * JS Compiler: AST → Evaluator
 * Monolithic compiler with all JS semantics
 */
const err = (msg = 'Compile error') => { throw Error(msg) };

// Block prototype chain attacks
const unsafe = k => k?.[0] === '_' && k[1] === '_' || k === 'constructor' || k === 'prototype';

// Control flow (type identifies the control flow, value carries result)
const BREAK = Symbol('break'), CONTINUE = Symbol('continue'), RETURN = Symbol('return');

// Accessor marker
const ACC = Symbol('accessor');
// Operator registry (exported for extensibility)
export const operators = {};

// Register an operator (chainable for overrides)
export const operator = (op, fn, prev = operators[op]) =>
  (operators[op] = (...args) => fn(...args) || prev?.(...args));

// Compile AST to evaluator function
export const compile = node =>
  !Array.isArray(node) ? (node === undefined ? () => undefined : ctx => ctx?.[node]) :
  node[0] === undefined ? (v => () => v)(node[1]) :
  operators[node[0]]?.(...node.slice(1)) ?? err(`Unknown operator: ${node[0]}`);

// Takes node and returns evaluator for prop access (container, path, ctx)
export const prop = (a, fn, generic, obj, path) => (
  a[0] === '()' && a.length == 2 ? prop(a[1], fn, generic) :
  typeof a === 'string' ? ctx => fn(ctx, a, ctx) :
  a[0] === '.' ? (obj = compile(a[1]), path = a[2], ctx => fn(obj(ctx), path, ctx)) :
  a[0] === '[]' && a.length === 3 ? (obj = compile(a[1]), path = compile(a[2]), ctx => fn(obj(ctx), path(ctx), ctx)) :
  generic ? (a = compile(a), ctx => fn([a(ctx)], 0, ctx)) : () => err('Bad left value')
);

// Loop body executor - handles control signals
const loop = (body, ctx) => {
  try { return { v: body(ctx) }; }
  catch (e) {
    if (e?.type === BREAK) return { b: 1 };
    if (e?.type === CONTINUE) return { c: 1 };
    if (e?.type === RETURN) return { r: 1, v: e.value };
    throw e;
  }
};

// Destructure value into context
const destructure = (pattern, value, ctx) => {
  if (typeof pattern === 'string') { ctx[pattern] = value; return; }
  const [op, ...items] = pattern;
  if (op === '{}') {
    for (const item of items) {
      let key, binding, def;
      if (item[0] === '=') [, [, key, binding], def] = item;
      else [, key, binding] = item;
      let val = value[key];
      if (val === undefined && def) val = compile(def)(ctx);
      destructure(binding, val, ctx);
    }
  } else if (op === '[]') {
    let i = 0;
    for (const item of items) {
      if (item === null) { i++; continue; }
      if (Array.isArray(item) && item[0] === '...') { ctx[item[1]] = value.slice(i); break; }
      let binding = item, def;
      if (Array.isArray(item) && item[0] === '=') [, binding, def] = item;
      let val = value[i++];
      if (val === undefined && def) val = compile(def)(ctx);
      destructure(binding, val, ctx);
    }
  }
};

// === Operators ===

// Arithmetic
operators['+'] = (a, b) => b !== undefined ?
  (a = compile(a), b = compile(b), ctx => a(ctx) + b(ctx)) :
  (a = compile(a), ctx => +a(ctx));
operators['-'] = (a, b) => b !== undefined ?
  (a = compile(a), b = compile(b), ctx => a(ctx) - b(ctx)) :
  (a = compile(a), ctx => -a(ctx));
operators['*'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) * b(ctx));
operators['/'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) / b(ctx));
operators['%'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) % b(ctx));
operators['**'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) ** b(ctx));

// Increment/decrement
operators['++'] = (a, b) => prop(a, b === null ? (obj, path) => obj[path]++ : (obj, path) => ++obj[path]);
operators['--'] = (a, b) => prop(a, b === null ? (obj, path) => obj[path]-- : (obj, path) => --obj[path]);

// Assignment
operators['='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] = b(ctx)));
operators['+='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] += b(ctx)));
operators['-='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] -= b(ctx)));
operators['*='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] *= b(ctx)));
operators['/='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] /= b(ctx)));
operators['%='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] %= b(ctx)));
operators['**='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] **= b(ctx)));

// Bitwise
operators['~'] = a => (a = compile(a), ctx => ~a(ctx));
operators['|'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) | b(ctx));
operators['&'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) & b(ctx));
operators['^'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) ^ b(ctx));
operators['|='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] |= b(ctx)));
operators['&='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] &= b(ctx)));
operators['^='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] ^= b(ctx)));

// Shift
operators['>>'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) >> b(ctx));
operators['<<'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) << b(ctx));
operators['>>>'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) >>> b(ctx));
operators['>>='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] >>= b(ctx)));
operators['<<='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] <<= b(ctx)));
operators['>>>='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] >>>= b(ctx)));

// Comparison
operators['!'] = a => (a = compile(a), ctx => !a(ctx));
operators['||'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) || b(ctx));
operators['&&'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) && b(ctx));
operators['??'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) ?? b(ctx));
operators['||='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] ||= b(ctx)));
operators['&&='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] &&= b(ctx)));
operators['??='] = (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] ??= b(ctx)));

operators['=='] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) == b(ctx));
operators['!='] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) != b(ctx));
operators['==='] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) === b(ctx));
operators['!=='] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) !== b(ctx));
operators['>'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) > b(ctx));
operators['<'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) < b(ctx));
operators['>='] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) >= b(ctx));
operators['<='] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) <= b(ctx));
operators['in'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) in b(ctx));

// Member access and array literal
operators['[]'] = (a, b) => {
  // Array literal: [1,2,3] - b is strictly undefined (AST length 2)
  if (b === undefined) {
    a = !a ? [] : a[0] === ',' ? a.slice(1) : [a];
    a = a.map(a => a[0] === '...' ? (a = compile(a[1]), ctx => a(ctx)) : (a = compile(a), ctx => [a(ctx)]));
    return ctx => a.flatMap(a => a(ctx));
  }
  // Member access: a[b] - b could be null (empty) or expression
  if (!b) err('Missing index');
  a = compile(a); b = compile(b);
  return ctx => { const k = b(ctx); return unsafe(k) ? undefined : a(ctx)[k]; };
};
operators['.'] = (a, b) => (a = compile(a), b = !b[0] ? b[1] : b, unsafe(b) ? () => undefined : ctx => a(ctx)[b]);
operators['?.'] = (a, b) => b !== undefined ?
  (a = compile(a), unsafe(b) ? () => undefined : ctx => a(ctx)?.[b]) :
  (a = compile(a), ctx => a(ctx) || (() => {}));

// Call - handles both regular calls and groups
operators['()'] = (a, b) => {
  // Group: (expr) - no second argument means grouping, not call
  if (b === undefined) return !a ? err('Empty ()') : compile(a);

  const args = !b ? () => [] :
    b[0] === ',' ? (b = b.slice(1).map(b => !b ? err() : compile(b)), ctx => b.map(arg => arg(ctx))) :
    (b = compile(b), ctx => [b(ctx)]);

  // Optional chain call: a?.()
  if (a[0] === '?.' && (a[2] || Array.isArray(a[1]))) {
    let container, path, optional = false;
    if (!a[2]) { optional = true; a = a[1]; }
    if (a[0] === '[]' && a.length === 3) path = compile(a[2]); else path = () => a[2];
    container = compile(a[1]);
    return optional ?
      ctx => { const p = path(ctx); return unsafe(p) ? undefined : container(ctx)?.[p]?.(...args(ctx)); } :
      ctx => { const p = path(ctx); return unsafe(p) ? undefined : container(ctx)?.[p](...args(ctx)); };
  }

  return prop(a, (obj, path, ctx) => obj[path](...args(ctx)), true);
};
// sequence returns last evaluated value; catches BREAK/CONTINUE and attaches result
const seq = (...args) => (args = args.map(compile), ctx => {
  let r;
  for (const arg of args) {
    try { r = arg(ctx); }
    catch (e) {
      if (e?.type === BREAK || e?.type === CONTINUE) { e.value = r; throw e; }
      throw e;
    }
  }
  return r;
});
operators[','] = seq;
operators[';'] = seq;

// Ternary
operators['?'] = (a, b, c) => (a = compile(a), b = compile(b), c = compile(c), ctx => a(ctx) ? b(ctx) : c(ctx));

// Typeof
operators['typeof'] = a => (a = compile(a), ctx => typeof a(ctx));

// Spread (for arrays/objects)
operators['...'] = a => (a = compile(a), ctx => Object.entries(a(ctx)));

// Collections
operators['{}'] = (a, b) => {
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
};

operators[':'] = (a, b) => (b = compile(b), Array.isArray(a) ?
  (a = compile(a), ctx => [[a(ctx), b(ctx)]]) : ctx => [[a, b(ctx)]]);

// Block
operators['block'] = body => body === undefined ? () => {} : (body = compile(body), ctx => body(ctx));

// Variables
operators['let'] = (pattern, val) => {
  if (typeof pattern === 'string') {
    val = val !== undefined ? compile(val) : null;
    return ctx => { ctx[pattern] = val?.(ctx); };
  }
  val = compile(val);
  return ctx => destructure(pattern, val(ctx), ctx);
};

operators['const'] = (pattern, val) => {
  val = compile(val);
  if (typeof pattern === 'string') return ctx => { ctx[pattern] = val(ctx); };
  return ctx => destructure(pattern, val(ctx), ctx);
};

// Conditionals
operators['if'] = (cond, body, alt) => {
  cond = compile(cond); body = compile(body); alt = alt !== undefined ? compile(alt) : null;
  return ctx => cond(ctx) ? body(ctx) : alt?.(ctx);
};

// Loops
operators['while'] = (cond, body) => {
  cond = compile(cond); body = compile(body);
  return ctx => {
    let r, res;
    while (cond(ctx)) if ((r = loop(body, ctx)).b) break; else if (r.r) return r.v; else if (!r.c) res = r.v;
    return res;
  };
};

operators['for'] = (init, cond, step, body) => {
  init = init ? compile(init) : null;
  cond = cond ? compile(cond) : () => true;
  step = step ? compile(step) : null;
  body = compile(body);
  return ctx => {
    let r, res;
    for (init?.(ctx); cond(ctx); step?.(ctx))
      if ((r = loop(body, ctx)).b) break; else if (r.r) return r.v; else if (!r.c) res = r.v;
    return res;
  };
};

operators['for-of'] = (name, iterable, body) => {
  iterable = compile(iterable); body = compile(body);
  return ctx => {
    let r, res;
    const prev = ctx[name];
    for (const val of iterable(ctx)) {
      ctx[name] = val;
      if ((r = loop(body, ctx)).b) break; else if (r.r) return r.v; else if (!r.c) res = r.v;
    }
    ctx[name] = prev;
    return res;
  };
};

operators['break'] = () => () => { throw { type: BREAK }; };
operators['continue'] = () => () => { throw { type: CONTINUE }; };
operators['return'] = val => (val = val !== undefined ? compile(val) : null,
  ctx => { throw { type: RETURN, value: val?.(ctx) }; });

// Switch
operators['switch'] = (val, cases) => {
  val = compile(val);
  cases = cases.map(([t, b]) => [t && compile(t), b ? compile(b) : () => {}]);
  return ctx => {
    const v = val(ctx);
    let matched = false, result;
    for (const [test, body] of cases) {
      if (matched || test === null || test(ctx) === v) {
        matched = true;
        try { result = body(ctx); }
        catch (e) {
          if (e?.type === BREAK) return e.value !== undefined ? e.value : result;
          throw e;
        }
      }
    }
    return result;
  };
};

// Try/catch/finally
operators['try'] = (tryBody, catchName, catchBody, finallyBody) => {
  tryBody = tryBody ? compile(tryBody) : null;
  catchBody = catchBody ? compile(catchBody) : null;
  finallyBody = finallyBody ? compile(finallyBody) : null;
  return ctx => {
    let result;
    try {
      result = tryBody?.(ctx);
    } catch (e) {
      if (e?.type === BREAK || e?.type === CONTINUE || e?.type === RETURN) throw e;
      if (catchName !== null && catchBody) {
        const had = catchName in ctx, orig = ctx[catchName];
        ctx[catchName] = e;
        try { result = catchBody(ctx); }
        finally { had ? ctx[catchName] = orig : delete ctx[catchName]; }
      } else if (catchName === null) throw e;
    } finally {
      finallyBody?.(ctx);
    }
    return result;
  };
};

// Throw
operators['throw'] = val => (val = compile(val), ctx => { throw val(ctx); });

// Functions
operators['function'] = (name, params, body) => {
  body = body ? compile(body) : () => undefined;
  let ps = params, restName = null, restIdx = -1;
  const last = params[params.length - 1];
  if (Array.isArray(last) && last[0] === '...') {
    restIdx = params.length - 1;
    restName = last[1];
    ps = params.slice(0, -1);
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
      catch (e) { if (e?.type === RETURN) return e.value; throw e; }
    };
    if (name) ctx[name] = fn;
    return fn;
  };
};

// Arrow functions
operators['=>'] = (a, b) => {
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
};

// Template literals
operators['`'] = (...parts) => (parts = parts.map(compile), ctx => parts.map(p => p(ctx)).join(''));
operators['``'] = (tag, ...parts) => {
  tag = compile(tag);
  const strings = [], exprs = [];
  for (const p of parts) {
    if (Array.isArray(p) && p[0] === undefined) strings.push(p[1]);
    else exprs.push(compile(p));
  }
  const strs = Object.assign([...strings], { raw: strings });
  return ctx => tag(ctx)(strs, ...exprs.map(e => e(ctx)));
};

// Accessors
operators['get'] = (name, body) => {
  body = body ? compile(body) : () => {};
  return ctx => [[ACC, name, {
    get() { const s = Object.create(ctx || {}); s.this = this; return body(s); }
  }]];
};

operators['set'] = (name, param, body) => {
  body = body ? compile(body) : () => {};
  return ctx => [[ACC, name, {
    set(v) { const s = Object.create(ctx || {}); s.this = this; s[param] = v; body(s); }
  }]];
};

// Unit suffixes (extensible) - register a unit suffix compiler
// Example: unit('px', (v, ctx) => ({ value: v, unit: 'px' }))
const unit = (name, fn = (v, ctx) => ({ value: v, unit: name })) =>
  operators[name] = val => (val = compile(val), ctx => fn(val(ctx), ctx));

export default compile;
