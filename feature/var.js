/**
 * Variable declarations: let, const, var - parse half
 *
 * AST (uniform for let/const/var):
 *   let x = 1         → ['let', ['=', 'x', 1]]
 *   let x = 1, y = 2  → ['let', ['=', 'x', 1], ['=', 'y', 2]]
 *   const {a} = x     → ['const', ['=', ['{}', 'a'], 'x']]
 *   for (let x in o)  → ['for', ['in', ['let', 'x'], 'o'], body]
 *   for (let in o)    → ['for', ['in', 'let', 'o'], body]   (let as identifier)
 *   ({let})           → ['()', ['{}', 'let']]               (let as identifier)
 *   var x             → ['var', 'x']
 */
import { expr, keyword, seek, idx } from '../parse.js';

const STATEMENT = 5, SEQ = 10;

// expr(SEQ-1) consumes `=` and the comma chain, so we get the whole declarator
// list. If nothing parses, the keyword falls back to identifier
// (`{let}`, `(let)`, bare `let`, etc.). For `for (let in/of obj)`, expr reads
// `in`/`of` as a bare identifier — backtrack so the binary op picks `let` up.
const decl = kw => {
  const from = idx;
  const node = expr(SEQ - 1);
  if (node == null) return kw;
  if (kw === 'let' && (node === 'in' || node === 'of')) return seek(from), kw;
  if (node[0] === 'in' || node[0] === 'of')
    return [node[0], [kw, node[1]], node[2]];
  if (node[0] === ',') return [kw, ...node.slice(1)];
  return [kw, node];
};

keyword('let', STATEMENT + 1, () => decl('let'));
keyword('const', STATEMENT + 1, () => decl('const'));
keyword('var', STATEMENT + 1, () => decl('var'));
