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
import { expr, keyword, seek, idx, next, parse, cur } from '../parse.js';

const STATEMENT = 5, SEQ = 10;

// expr(SEQ-1) consumes `=` and the comma chain, so we get the whole declarator
// list. If nothing parses, the keyword falls back to identifier
// (`{let}`, `(let)`, bare `let`, etc.). For `for (let in/of obj)`, expr reads
// `in`/`of` as a bare identifier — backtrack so the binary op picks `let` up.
// A for-in/of head keeps its in/of inside the declarator ([let [in x o]]);
// loop.js re-associates it to the documented shape.
const decl = kw => {
  const from = idx;
  const node = expr(SEQ - 1);
  if (node == null) return kw;
  if (kw === 'let' && (node === 'in' || node === 'of')) return seek(from), kw;
  if (node[0] === ',') return [kw, ...node.slice(1)];
  return [kw, node];
};

keyword('let', STATEMENT + 1, () => decl('let'));
keyword('const', STATEMENT + 1, () => decl('const'));
keyword('var', STATEMENT + 1, () => decl('var'));

// `using x = res` (explicit resource management) — CONTEXTUAL keyword: only
// `name = init` declarators make a declaration; anything else (`using(x)` call,
// `using.y`, `using + 1`, bare `using`) backtracks to the identifier. Registered
// at TOKEN-high precedence so `await using x = r` works (await's operand parse
// runs at unary precedence, above STATEMENT — let/const need no such reach).
// Spec's [no LineTerminator here] between `using` and the binding is not
// enforced. `using x` without initializer stays a parse error (spec: required).
const declish = n => Array.isArray(n) && n[0] === '=' && typeof n[1] === 'string';
keyword('using', 200, () => {
  const from = idx;
  parse.space();
  const c = cur.charCodeAt(idx);
  // Commit only when `name =` (single =, not ==/=>) is ahead — the declarator
  // parse would err() on anything else mid-expression (e.g. `let using = 5`,
  // where the inner expr would start at bare `=`).
  if (parse.id(c) && (c < 48 || c > 57)) {
    const nameAt = idx;
    next(parse.id);
    parse.space();
    if (cur.charCodeAt(idx) === 61 && cur.charCodeAt(idx + 1) !== 61 && cur.charCodeAt(idx + 1) !== 62) {
      seek(nameAt);
      const node = expr(SEQ - 1);
      if (node[0] === ',' ? node.slice(1).every(declish) : declish(node))
        return node[0] === ',' ? ['using', ...node.slice(1)] : ['using', node];
    }
  }
  return seek(from), 'using';
});
