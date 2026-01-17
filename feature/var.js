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
import { token, expr, space, operator, compile } from '../parse.js';
import { keyword } from './block.js';
import { destructure } from './destruct.js';

const STATEMENT = 5, SEQ = 10, ASSIGN = 20;

// let/const: expr(SEQ-1) consumes assignment, stops before comma
// For for-in/of, return ['in/of', ['let', x], iterable] not ['let', ['in', x, it]]
// For comma, return ['let', decl1, decl2, ...] not ['let', [',', ...]]
const decl = keyword => {
  let node = expr(SEQ - 1);
  // for (let x in obj) - restructure so for-loop sees in/of at top
  if (node?.[0] === 'in' || node?.[0] === 'of')
    return [node[0], [keyword, node[1]], node[2]];
  // let x = 1, y = 2 - flatten comma into nary let
  if (node?.[0] === ',')
    return [keyword, ...node.slice(1)];
  return [keyword, node];
};

token('let', STATEMENT + 1, a => !a && decl('let'));
token('const', STATEMENT + 1, a => !a && decl('const'));

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
