/**
 * Variable declarations: let, const, var - parse half
 *
 * AST:
 *   let x = 1         → ['let', ['=', 'x', 1]]
 *   let x = 1, y = 2  → ['let', ['=', 'x', 1], ['=', 'y', 2]]
 *   const {a} = x     → ['const', ['=', ['{}', 'a'], 'x']]
 *   for (let x in o)  → ['for', ['in', ['let', 'x'], 'o'], body]
 *   var x             → ['var', 'x']   (acts as assignment target)
 */
import { expr, space, keyword, seek, word, idx } from '../parse.js';

const STATEMENT = 5, SEQ = 10, ASSIGN = 20;

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
