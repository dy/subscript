// Loops: while, do-while, for, for await, break, continue, return
import { expr, skip, space, parse, word, parens, cur, idx, operator, compile, next, seek } from '../parse.js';
import { body, keyword } from './block.js';
import { destructure } from './destruct.js';
import { BREAK, CONTINUE, RETURN } from './control.js';

export { BREAK, CONTINUE, RETURN };

const STATEMENT = 5, CBRACE = 125, SEMI = 59;

keyword('while', STATEMENT + 1, () => (space(), ['while', parens(), body()]));
keyword('do', STATEMENT + 1, () => (b => (space(), skip(5), space(), ['do', b, parens()]))(body()));

// for / for await
keyword('for', STATEMENT + 1, () => {
  space();
  // for await (x of y)
  if (word('await')) {
    skip(5);
    space();
    return ['for await', parens(), body()];
  }
  return ['for', parens(), body()];
});

keyword('break', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  const from = idx;
  space();
  const c = cur.charCodeAt(idx);
  if (!c || c === CBRACE || c === SEMI || parse.newline) return ['break'];
  const label = next(parse.id);
  if (!label) return ['break'];
  // Label must be followed by end/semicolon/newline, not another token
  space();
  const cc = cur.charCodeAt(idx);
  if (!cc || cc === CBRACE || cc === SEMI || parse.newline) return ['break', label];
  // Not a valid label - backtrack
  seek(from);
  return ['break'];
});
keyword('continue', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  const from = idx;
  space();
  const c = cur.charCodeAt(idx);
  if (!c || c === CBRACE || c === SEMI || parse.newline) return ['continue'];
  const label = next(parse.id);
  if (!label) return ['continue'];
  space();
  const cc = cur.charCodeAt(idx);
  if (!cc || cc === CBRACE || cc === SEMI || parse.newline) return ['continue', label];
  seek(from);
  return ['continue'];
});
keyword('return', STATEMENT + 1, () => {
  parse.asi && (parse.newline = false);
  space();
  const c = cur.charCodeAt(idx);
  return !c || c === CBRACE || c === SEMI || parse.newline ? ['return'] : ['return', expr(STATEMENT)];
});

// Compile - inline try/catch, use JS break/continue directly
operator('while', (cond, body) => {
  cond = compile(cond); body = compile(body);
  return ctx => {
    let res;
    while (cond(ctx)) try { res = body(ctx); } catch (e) {
      if (e === BREAK) break;
      if (e === CONTINUE) continue;
      if (e === RETURN) return e[0];
      throw e;
    }
    return res;
  };
});

operator('do', (body, cond) => {
  body = compile(body); cond = compile(cond);
  return ctx => {
    let res;
    do try { res = body(ctx); } catch (e) {
      if (e === BREAK) break;
      if (e === CONTINUE) continue;
      if (e === RETURN) return e[0];
      throw e;
    } while (cond(ctx));
    return res;
  };
});

operator('for', (head, body) => {
  // Normalize head: [';', init, cond, step] or single expr (for-in/of)
  if (Array.isArray(head) && head[0] === ';') {
    let [, init, cond, step] = head;
    init = init ? compile(init) : null;
    cond = cond ? compile(cond) : () => true;
    step = step ? compile(step) : null;
    body = compile(body);
    return ctx => {
      let res;
      for (init?.(ctx); cond(ctx); step?.(ctx)) try { res = body(ctx); } catch (e) {
        if (e === BREAK) break;
        if (e === CONTINUE) continue;
        if (e === RETURN) return e[0];
        throw e;
      }
      return res;
    };
  }
  // For-in/of: head is ['in', lhs, rhs] or ['of', lhs, rhs]
  if (Array.isArray(head) && (head[0] === 'in' || head[0] === 'of')) {
    let [op, lhs, rhs] = head;
    // Extract name from declaration: ['let', 'x'] → 'x'
    if (Array.isArray(lhs) && (lhs[0] === 'let' || lhs[0] === 'const' || lhs[0] === 'var')) lhs = lhs[1];
    if (op === 'in') return forIn(lhs, rhs, body);
    if (op === 'of') return forOf(lhs, rhs, body);
  }
});

const forOf = (name, iterable, body) => {
  iterable = compile(iterable); body = compile(body);
  const isPattern = Array.isArray(name);
  return ctx => {
    let res;
    const prev = isPattern ? null : ctx[name];
    for (const val of iterable(ctx)) {
      if (isPattern) destructure(name, val, ctx); else ctx[name] = val;
      try { res = body(ctx); } catch (e) {
        if (e === BREAK) break;
        if (e === CONTINUE) continue;
        if (e === RETURN) return e[0];
        throw e;
      }
    }
    if (!isPattern) ctx[name] = prev;
    return res;
  };
};

const forIn = (name, obj, body) => {
  obj = compile(obj); body = compile(body);
  const isPattern = Array.isArray(name);
  return ctx => {
    let res;
    const prev = isPattern ? null : ctx[name];
    for (const key in obj(ctx)) {
      if (isPattern) destructure(name, key, ctx); else ctx[name] = key;
      try { res = body(ctx); } catch (e) {
        if (e === BREAK) break;
        if (e === CONTINUE) continue;
        if (e === RETURN) return e[0];
        throw e;
      }
    }
    if (!isPattern) ctx[name] = prev;
    return res;
  };
};

operator('break', () => () => { throw BREAK; });
operator('continue', () => () => { throw CONTINUE; });
operator('return', val => (val = val !== undefined ? compile(val) : null,
  ctx => { throw (RETURN[0] = val?.(ctx), RETURN); }));
