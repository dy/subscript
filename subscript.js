/**
 * subscript: Default bundle (jessie parser + JS compiler)
 *
 * For parser-only presets, import expr.js, justin.js, or jessie.js directly.
 * For a different compiler, import from compile/
 */
import './jessie.js';
import { compile, operator, operators, prop, BREAK, CONTINUE, RETURN } from './compile/js.js';
import { parse } from './src/parse.js';

export { parse, token, binary, unary, nary, group, access } from './src/parse.js';
export { compile, operator, operators, prop, BREAK, CONTINUE, RETURN } from './compile/js.js';
export { codegen } from './compile/js-emit.js';

export default s => compile(parse(s));
