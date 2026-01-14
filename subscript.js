/**
 * subscript: Default bundle (jessie parser + JS compiler)
 *
 * For parser-only presets, import from parse/expr.js, parse/justin.js, or parse/jessie.js
 * For a different compiler, import from compile/
 */
import { parse } from './parse/jessie.js';
import { compile, operator, operators, prop } from './compile/js.js';

export { parse } from './parse/jessie.js';
export { token, binary, unary, nary, group, access, literal } from './parse/pratt.js';
export { compile, operator, operators, prop } from './compile/js.js';
export { codegen } from './compile/js-emit.js';

export default s => compile(parse(s));
