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
operators['='] = (a, b) => {
  // Handle let/const/var declarations: ['=', ['let', pattern], value]
  if (Array.isArray(a) && (a[0] === 'let' || a[0] === 'const' || a[0] === 'var')) {
    const pattern = a[1];
    b = compile(b);
    if (typeof pattern === 'string') return ctx => { ctx[pattern] = b(ctx); };
    return ctx => destructure(pattern, b(ctx), ctx);
  }
  return (b = compile(b), prop(a, (obj, path, ctx) => obj[path] = b(ctx)));
};
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
operators['?.'] = (a, b) => (a = compile(a), unsafe(b) ? () => undefined : ctx => a(ctx)?.[b]);
operators['?.[]'] = (a, b) => (a = compile(a), b = compile(b), ctx => { const k = b(ctx); return unsafe(k) ? undefined : a(ctx)?.[k]; });
operators['?.()'] = (a, b) => {
  const args = !b ? () => [] :
    b[0] === ',' ? (b = b.slice(1).map(b => !b ? err() : compile(b)), ctx => b.map(arg => arg(ctx))) :
    (b = compile(b), ctx => [b(ctx)]);

  // Handle nested optional chain: a?.method?.() or a?.["method"]?.()
  if (a[0] === '?.') {
    const container = compile(a[1]);
    const prop = a[2];
    return unsafe(prop) ? () => undefined :
      ctx => { const c = container(ctx); return c?.[prop]?.(...args(ctx)); };
  }
  if (a[0] === '?.[]') {
    const container = compile(a[1]);
    const prop = compile(a[2]);
    return ctx => { const c = container(ctx); const p = prop(ctx); return unsafe(p) ? undefined : c?.[p]?.(...args(ctx)); };
  }
  const fn = compile(a);
  return ctx => fn(ctx)?.(...args(ctx));
};

// Call - handles both regular calls and groups
operators['()'] = (a, b) => {
  // Group: (expr) - no second argument means grouping, not call
  if (b === undefined) return !a ? err('Empty ()') : compile(a);

  const args = !b ? () => [] :
    b[0] === ',' ? (b = b.slice(1).map(b => !b ? err() : compile(b)), ctx => b.map(arg => arg(ctx))) :
    (b = compile(b), ctx => [b(ctx)]);

  // Optional chain method call: a?.method() or a?.["method"]()
  if (a[0] === '?.') {
    const container = compile(a[1]);
    const prop = a[2];
    return unsafe(prop) ? () => undefined :
      ctx => { const c = container(ctx); return c?.[prop]?.(...args(ctx)); };
  }
  if (a[0] === '?.[]') {
    const container = compile(a[1]);
    const prop = compile(a[2]);
    return ctx => { const c = container(ctx); const p = prop(ctx); return unsafe(p) ? undefined : c?.[p]?.(...args(ctx)); };
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

// Void - always returns undefined
operators['void'] = a => (a = compile(a), ctx => (a(ctx), undefined));

// Delete - removes property (needs special handling for member access)
operators['delete'] = a => {
  if (a[0] === '.') {
    const obj = compile(a[1]), key = a[2];
    return ctx => delete obj(ctx)[key];
  }
  if (a[0] === '[]') {
    const obj = compile(a[1]), key = compile(a[2]);
    return ctx => delete obj(ctx)[key(ctx)];
  }
  return () => true; // delete on non-reference returns true
};

// Instanceof - prototype chain check
operators['instanceof'] = (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) instanceof b(ctx));

// new - constructor call: ['new', ['()', target, args]] or ['new', target]
operators['new'] = (call) => {
  // new Foo() → ['new', ['()', 'Foo', args]]
  // new Foo → ['new', 'Foo']
  const target = compile(call?.[0] === '()' ? call[1] : call);
  const args = call?.[0] === '()' ? call[2] : null;
  const argList = !args ? () => [] :
    args[0] === ',' ? (a => ctx => a.map(f => f(ctx)))(args.slice(1).map(compile)) :
    (a => ctx => [a(ctx)])(compile(args));
  return ctx => new (target(ctx))(...argList(ctx));
};

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

// Variables: let/const wrap their body expression
// ['let', 'x'] - declare undefined
// ['let', ['=', 'x', val]] - declare with value
// ['let', [',', ...]] - multiple (compiler handles in comma context)
operators['let'] = body => {
  if (typeof body === 'string') return ctx => { ctx[body] = undefined; };
  if (body[0] === '=') {
    // ['=', pattern, value] - handle destructuring
    const [, pattern, val] = body;
    const v = compile(val);
    if (typeof pattern === 'string') return ctx => { ctx[pattern] = v(ctx); };
    return ctx => destructure(pattern, v(ctx), ctx);
  }
  // Other expressions (comma, etc) - just compile
  return compile(body);
};
operators['const'] = operators['let'];
operators['var'] = operators['let'];

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

operators['do'] = (body, cond) => {
  body = compile(body); cond = compile(cond);
  return ctx => {
    let r, res;
    do { if ((r = loop(body, ctx)).b) break; else if (r.r) return r.v; else if (!r.c) res = r.v; } while (cond(ctx));
    return res;
  };
};

operators['for'] = (head, body) => {
  // Normalize head: [';', init, cond, step] or single expr (for-in/of)
  if (Array.isArray(head) && head[0] === ';') {
    let [, init, cond, step] = head;
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
  }
  // For-in/of: head is ['in', lhs, rhs] or ['of', lhs, rhs]
  if (Array.isArray(head) && (head[0] === 'in' || head[0] === 'of')) {
    let [op, lhs, rhs] = head;
    // Extract name from declaration: ['let', 'x'] → 'x'
    if (Array.isArray(lhs) && (lhs[0] === 'let' || lhs[0] === 'const' || lhs[0] === 'var')) lhs = lhs[1];
    if (op === 'in') return operators['for-in'](lhs, rhs, body);
    if (op === 'of') return operators['for-of'](lhs, rhs, body);
  }
  err('Invalid for loop');
};

operators['for-of'] = (name, iterable, body) => {
  iterable = compile(iterable); body = compile(body);
  const isPattern = Array.isArray(name);
  return ctx => {
    let r, res;
    const prev = isPattern ? null : ctx[name];
    for (const val of iterable(ctx)) {
      if (isPattern) destructure(name, val, ctx); else ctx[name] = val;
      if ((r = loop(body, ctx)).b) break; else if (r.r) return r.v; else if (!r.c) res = r.v;
    }
    if (!isPattern) ctx[name] = prev;
    return res;
  };
};

operators['for-in'] = (name, obj, body) => {
  obj = compile(obj); body = compile(body);
  const isPattern = Array.isArray(name);
  return ctx => {
    let r, res;
    const prev = isPattern ? null : ctx[name];
    for (const key in obj(ctx)) {
      if (isPattern) destructure(name, key, ctx); else ctx[name] = key;
      if ((r = loop(body, ctx)).b) break; else if (r.r) return r.v; else if (!r.c) res = r.v;
    }
    if (!isPattern) ctx[name] = prev;
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

// Async: ['async', fn] wraps function to return async version
operators['async'] = fn => {
  const inner = compile(fn);
  return ctx => {
    const f = inner(ctx);
    return async function(...args) { return f(...args); };
  };
};

// Await: ['await', expr]
operators['await'] = a => (a = compile(a), async ctx => await a(ctx));

// Class: ['class', name, base, body]
operators['class'] = (name, base, body) => {
  base = base ? compile(base) : null;
  body = body ? compile(body) : null;
  return ctx => {
    const Parent = base ? base(ctx) : Object;
    // Build class via Function constructor for proper inheritance
    const cls = function(...args) {
      if (new.target === undefined) return err('Class constructor must be called with new');
      const instance = base ? Reflect.construct(Parent, args, new.target) : Object.create(cls.prototype);
      // Run constructor if defined
      if (cls.prototype.__constructor__) cls.prototype.__constructor__.apply(instance, args);
      return instance;
    };
    Object.setPrototypeOf(cls.prototype, Parent.prototype);
    Object.setPrototypeOf(cls, Parent);
    // Populate methods from body
    if (body) {
      const methods = Object.create(ctx);
      methods['super'] = Parent;
      const entries = body(methods);
      if (entries) for (const [k, v] of Array.isArray(entries) && typeof entries[0]?.[0] === 'string' ? entries : []) {
        if (k === 'constructor') cls.prototype.__constructor__ = v;
        else cls.prototype[k] = v;
      }
    }
    if (name) ctx[name] = cls;
    return cls;
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
    get: function() { const s = Object.create(ctx || {}); s.this = this; return body(s); }
  }]];
};

operators['set'] = (name, param, body) => {
  body = body ? compile(body) : () => {};
  return ctx => [[ACC, name, {
    set: function(v) { const s = Object.create(ctx || {}); s.this = this; s[param] = v; body(s); }
  }]];
};

// Unit suffixes (extensible) - register a unit suffix compiler
// Example: unit('px', (v, ctx) => ({ value: v, unit: 'px' }))
const unit = (name, fn = (v, ctx) => ({ value: v, unit: name })) =>
  operators[name] = val => (val = compile(val), ctx => fn(val(ctx), ctx));

export default compile;
