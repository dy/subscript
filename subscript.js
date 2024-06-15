/**
 * Subscript dialect includes common operators / primitives for all languages.
 * This file imports various language features and exports the main parsing and compiling functions.
 */
// @ts-check
import './feature/number.js'
import './feature/string.js'
import './feature/call.js'
import './feature/access.js'
import './feature/group.js'
import './feature/mult.js'
import './feature/add.js'
import './feature/increment.js'
import './feature/bitwise.js'
import './feature/compare.js'
import './feature/logic.js'
import './feature/assign.js'
import compile from './src/compile.js'
import parse from './src/parse.js'

export { parse, access, binary, unary, nary, group, lookup, token } from './src/parse.js'
export { compile, operator, prop } from './src/compile.js'

/**
 * Parses and compiles a given string into an executable function.
 * @param {string} s - The string to parse and compile.
 * @returns {Function} A function that, when executed, evaluates the parsed expression within a given context.
 */
export default s => compile(parse(s))
