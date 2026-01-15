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

// Parse: name or name = value (no validation - defer to compile)
const decl = op => {
  space();
  const e = expr(ASSIGN);
  return e?.[0] === '=' && typeof e[1] === 'string' ? [op, e[1], e[2]] :
         typeof e === 'string' ? [op, e] :
         Array.isArray(e) ? [op, e] : [op];
};

token('let', STATEMENT, a => !a && decl('let'));
token('const', STATEMENT, a => !a && decl('const'));
token('var', STATEMENT, a => !a && decl('var'));
