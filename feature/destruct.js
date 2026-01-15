/**
 * Variable declarations: let/const as prefix operators
 *
 * AST:
 *   let x = 1         → ['let', ['=', 'x', 1]]
 *   let x = 1, y = 2  → ['let', [',', ['=', 'x', 1], ['=', 'y', 2]]]
 *   const {a} = x     → ['const', ['=', ['{}', 'a'], 'x']]
 *   for (let x in o)  → ['for', ['in', ['let', 'x'], 'o'], body]
 *
 * Stops at COMP so `in`/`of` remain for for-loops
 */
import { token, expr } from '../parse/pratt.js';

const STATEMENT = 5, SEQ = 10;

// expr(SEQ-1) consumes comma (prec 10 > 9)
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
