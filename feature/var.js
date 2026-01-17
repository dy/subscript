/**
 * Variable declarations: let, const, var
 *
 * AST:
 *   let x       → ['let', 'x']
 *   let x = 1   → ['let', 'x', val]
 *   const x = 1 → ['const', 'x', val]
 *   var x = 1   → ['var', 'x', val]
 */
import { expr, space, operator, compile, destructure } from '../parse.js';
import { keyword } from './block.js';

const STATEMENT = 5, ASSIGN = 20;

// Parse: name or name = value (no validation - defer to compile)
const decl = op => {
  space();
  const e = expr(ASSIGN);
  return e?.[0] === '=' && typeof e[1] === 'string' ? [op, e[1], e[2]] :
         typeof e === 'string' ? [op, e] :
         Array.isArray(e) ? [op, e] : [op];
};

keyword('let', STATEMENT, () => decl('let'));
keyword('const', STATEMENT, () => decl('const'));
keyword('var', STATEMENT, () => decl('var'));

// Compile
const varOp = body => {
  if (typeof body === 'string') return ctx => { ctx[body] = undefined; };
  if (body[0] === '=') {
    const [, pattern, val] = body;
    const v = compile(val);
    if (typeof pattern === 'string') return ctx => { ctx[pattern] = v(ctx); };
    return ctx => destructure(pattern, v(ctx), ctx);
  }
  return compile(body);
};
operator('let', varOp);
operator('const', varOp);
operator('var', varOp);
