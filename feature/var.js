/**
 * Variable declarations: let, const, var
 *
 * AST:
 *   let x = 1         → ['let', ['=', 'x', 1]]
 *   let x = 1, y = 2  → ['let', ['=', 'x', 1], ['=', 'y', 2]]
 *   const {a} = x     → ['const', ['=', ['{}', 'a'], 'x']]
 *   for (let x in o)  → ['for', ['in', ['let', 'x'], 'o'], body]
 *   var x             → ['var', 'x']   (acts as assignment target)
 */
import { expr, space, keyword, operator, compile, seek, word, idx } from '../parse.js';

const STATEMENT = 5, SEQ = 10, ASSIGN = 20;

// Flatten comma into array: [',', a, b, c] → [a, b, c]
const flatten = items => items[0]?.[0] === ',' ? items[0].slice(1) : items;

// Destructure value into context
export const destructure = (pattern, value, ctx) => {
  if (typeof pattern === 'string') { ctx[pattern] = value; return; }
  const [op, ...raw] = pattern;
  const items = flatten(raw);
  if (op === '{}') {
    const used = [];
    for (const item of items) {
      // Rest: {...rest}
      if (Array.isArray(item) && item[0] === '...') {
        const rest = {};
        for (const k in value) if (!used.includes(k)) rest[k] = value[k];
        ctx[item[1]] = rest;
        break;
      }
      let key, binding, def;
      // Shorthand: {x} → item is 'x'
      // With default: {x = 1} → ['=', 'x', default]
      // Rename: {x: y} → [':', 'x', 'y']
      if (typeof item === 'string') { key = binding = item }
      else if (item[0] === '=') { typeof item[1] === 'string' ? (key = binding = item[1]) : ([, key, binding] = item[1]); def = item[2] }
      else { [, key, binding] = item }
      used.push(key);
      let val = value[key];
      if (val === undefined && def) val = compile(def)(ctx);
      destructure(binding, val, ctx);
    }
  }
  else if (op === '[]') {
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

// let/const: expr(SEQ-1) consumes assignment, stops before comma
// For for-in/of, return ['in/of', ['let', x], iterable] not ['let', ['in', x, it]]
// For comma, return ['let', decl1, decl2, ...] not ['let', [',', ...]]
const decl = keyword => {
  // let as identifier in for-in: for (let in obj)
  if (keyword === 'let') {
    const from = idx;
    space();
    if (word('in')) { seek(from); return; }
    seek(from);
  }
  let node = expr(SEQ - 1);
  // for (let x in obj) - restructure so for-loop sees in/of at top
  if (node?.[0] === 'in' || node?.[0] === 'of')
    return [node[0], [keyword, node[1]], node[2]];
  // let x = 1, y = 2 - flatten comma into nary let
  if (node?.[0] === ',')
    return [keyword, ...node.slice(1)];
  return [keyword, node];
};

keyword('let', STATEMENT + 1, () => decl('let'));
keyword('const', STATEMENT + 1, () => decl('const'));

// var: just declares identifier, assignment happens separately
// var x = 5 → ['=', ['var', 'x'], 5]
keyword('var', STATEMENT, () => (space(), ['var', expr(ASSIGN)]));

// Compile
const varOp = (...decls) => {
  decls = decls.map(d => {
    // Just identifier: let x
    if (typeof d === 'string') return ctx => { ctx[d] = undefined; };
    // Assignment: let x = 1
    if (d[0] === '=') {
      const [, pattern, val] = d;
      const v = compile(val);
      if (typeof pattern === 'string') return ctx => { ctx[pattern] = v(ctx); };
      return ctx => destructure(pattern, v(ctx), ctx);
    }
    return compile(d);
  });
  return ctx => { for (const d of decls) d(ctx); };
};
operator('let', varOp);
operator('const', varOp);
// var just declares the variable (assignment handled by = operator)
operator('var', name => (typeof name === 'string'
  ? ctx => { ctx[name] = undefined; }
  : () => {}));
