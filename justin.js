// justin lang https://github.com/endojs/Jessie/issues/66
import { skip, cur, idx, err, expr, lookup, token, binary, unary } from './src/parse.js'
import compile, { operator } from './src/compile.js'
import { CPAREN, COLON, PREC_ASSIGN, PREC_PREFIX, PREC_OR, PREC_ACCESS, PREC_COMP, PREC_EXP, PREC_GROUP } from './src/const.js'

// register subscript operators set
import subscript from './subscript.js'
import './feature/comment.js'
import './feature/pow.js'
import './feature/in.js'
import './feature/ternary.js'
import './feature/bool.js'
import './feature/array.js'
import './feature/object.js'
import './feature/optional.js'

// operators
// set('===', PREC_EQ, (a, b) => a === b)
// set('!==', PREC_EQ, (a, b) => a !== b)
// binary('??', PREC_OR), operator('??', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) ?? b(ctx)))

// literals
token('null', 20, a => a ? err() : [, null])
// token('undefined', 20, a => a ? err() : [, undefined])
// token('NaN', 20, a => a ? err() : [, NaN])

export default subscript
export * from './subscript.js'
