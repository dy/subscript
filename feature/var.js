/**
 * Variable declarations: let, const
 *
 * AST:
 *   let x       → ['let', 'x']
 *   let x = 1   → ['let', 'x', val]
 *   const x = 1 → ['const', 'x', val]
 */
import { token, expr, err, parse, next, space } from '../src/parse.js';
import { operator, compile } from '../src/compile.js';
import { PREC_STATEMENT, PREC_ASSIGN } from '../src/const.js';

// Parse: name or name = value
const decl = op => {
  space();
  const e = expr(PREC_ASSIGN);
  return e?.[0] === '=' && typeof e[1] === 'string' ? [op, e[1], e[2]] :
         typeof e === 'string' ? [op, e] :
         err('Expected identifier');
};

token('let', PREC_STATEMENT, a => !a && decl('let'));
token('const', PREC_STATEMENT, a => !a && (a = decl('const'), a.length < 3 ? err('Expected =') : a));

operator('let', (name, val) => (val = val !== undefined ? compile(val) : null, ctx => { ctx[name] = val?.(ctx); }));
operator('const', (name, val) => (val = compile(val), ctx => { ctx[name] = val(ctx); }));
