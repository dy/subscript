/**
 * Subscript dialect includes common operators / primitives for all languages
 */
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

export { parse, access, binary, unary, nary, group, token } from './src/parse.js'
export { compile, operator } from './src/compile.js'

export default s => compile(parse(s))
