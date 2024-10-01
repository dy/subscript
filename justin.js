// no-keywords js, just in https://github.com/endojs/Jessie/issues/66
import { err, token, binary, unary } from './src/parse.js'
import compile, { operator, prop } from './src/compile.js'

import subscript from './subscript.js'
import './feature/comment.js'
import './feature/pow.js'
import './feature/ternary.js'
import './feature/bool.js'
import './feature/array.js'
import './feature/object.js'
import './feature/arrow.js'
import './feature/optional.js'
import './feature/spread.js'
import { PREC_ASSIGN, PREC_EQ, PREC_LOR, PREC_COMP } from './src/const.js'

binary('in', PREC_COMP), operator('in', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) in b(ctx)))

// register !==, ===
binary('===', PREC_EQ), binary('!==', 9)
operator('===', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) === b(ctx)))
operator('!==', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) !== b(ctx)))

// add nullish coalescing
binary('??', PREC_LOR)
operator('??', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) ?? b(ctx)))
binary('??=', PREC_ASSIGN, true)
operator('??=', (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => (obj[path] ??= b(ctx)))))

// complete logical assignments
binary('||=', PREC_ASSIGN, true)
operator('||=', (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => (obj[path] ||= b(ctx)))))
binary('&&=', PREC_ASSIGN, true)
operator('&&=', (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => (obj[path] &&= b(ctx)))))

// unsigned shift
binary('>>>', PREC_EQ)
operator('>>>', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) >>> b(ctx)))
binary('>>>=', PREC_ASSIGN, true)
operator('>>>=', (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => (obj[path] >>>= b(ctx)))))

// add JS literals
token('undefined', 20, a => a ? err() : [, undefined])
token('NaN', 20, a => a ? err() : [, NaN])
token('null', 20, a => a ? err() : [, null])

export default subscript
export * from './subscript.js'
