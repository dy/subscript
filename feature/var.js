/**
 * Variable declarations: let, const, var
 *
 * AST:
 *   let x       → ['let', 'x']
 *   let x = 1   → ['let', 'x', val]
 *   const x = 1 → ['const', 'x', val]
 *   var x = 1   → ['var', 'x', val]
 */
import { token, expr, err, space } from '../parse/pratt.js';

const STATEMENT = 5, ASSIGN = 20;

// Parse: name or name = value
const decl = op => {
  space();
  const e = expr(ASSIGN);
  return e?.[0] === '=' && typeof e[1] === 'string' ? [op, e[1], e[2]] :
         typeof e === 'string' ? [op, e] :
         err('Expected identifier');
};

token('let', STATEMENT, a => !a && decl('let'));
token('const', STATEMENT, a => !a && (a = decl('const'), a.length < 3 ? err('Expected =') : a));
token('var', STATEMENT, a => !a && decl('var'));
