/**
 * Subscript: safe expression evaluator (base dialect)
 *
 * Literals: numbers, strings
 * Operators: arithmetic, bitwise, logical, comparison, shift
 * Access: member, index, call
 * Assignment: =, +=, etc.
 */
import './feature/literal.js'
import './feature/member.js'
import './feature/group.js'
import './feature/assign.js'
import './feature/arithmetic.js'
import './feature/bit.js'
import './feature/cmp.js'
import './feature/shift.js'  // Must come AFTER cmp.js (>> chains after >)
import compile from './src/compile.js'
import parse from './src/parse.js'

export { parse, access, binary, unary, nary, group, token } from './src/parse.js'
export { compile, operator } from './src/compile.js'
export { stringify } from './src/stringify.js'

export default s => compile(parse(s))
