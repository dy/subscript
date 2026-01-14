/**
 * subscript: Default bundle (jessie parser + JS compiler)
 *
 * For parser-only presets, import from parse/expr.js, parse/justin.js, or parse/jessie.js
 * For a different compiler, import from compile/
 */
import './parse/jessie.js';
import { compile, operator, operators, prop } from './compile/js.js';
import { parse } from './parse/pratt.js';

export { parse, token, binary, unary, nary, group, access } from './parse/pratt.js';
export { compile, operator, operators, prop } from './compile/js.js';
export { codegen } from './compile/js-emit.js';

export default s => compile(parse(s));
