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

token('null', 20, a => a ? err() : [, null])

export default subscript
export * from './subscript.js'
