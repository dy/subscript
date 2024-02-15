// justin lang https://github.com/endojs/Jessie/issues/66
import { skip, cur, idx, err, expr, lookup, token, binary, unary } from './src/parse.js'
import compile, { operator } from './src/compile.js'
import subscript, { set } from './src/index.js'
import { CPAREN, COLON, PREC_ASSIGN, PREC_PREFIX, PREC_OR, PREC_ACCESS, PREC_COMP, PREC_EXP, PREC_GROUP } from './src/const.js'

// register subscript operators set
import './subscript.js'
import './feature/comment.js'
import './feature/ternary.js'
import './feature/bool.js'
import './feature/array.js'
import './feature/object.js'

// operators
// set('===', PREC_EQ, (a, b) => a === b)
// set('!==', PREC_EQ, (a, b) => a !== b)
set('~', PREC_PREFIX, (a) => ~a)

set('??', PREC_OR, (a, b) => a ?? b)

// a?.[, a?.( - postfix operator
token('?.', PREC_ACCESS, a => a && ['?.', a])
// a ?.
operator('?.', a => (a = compile(a), ctx => a(ctx) || (() => { })))

// a?.b, a?.() - optional chain operator
token('?.', PREC_ACCESS, (a, b) => a && (b = expr(PREC_ACCESS), !b?.map) && ['?.', a, b])
// a ?. b
operator('?.', (a, b) => b && (a = compile(a), ctx => a(ctx)?.[b]))

// a?.x() - keep context, but watch out a?.()
operator('(', (a, b, container, args, path, optional) => (b != null) && (a[0] === '?.') && (a[2] || Array.isArray(a[1])) && (
  args = b == '' ? () => [] : // a()
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(a => a(ctx))) : // a(b,c)
      (b = compile(b), ctx => [b(ctx)]), // a(b)
  // a?.()
  !a[2] && (optional = true, a = a[1]),
  // a?.['x']?.()
  a[0] === '[' ? (path = compile(a[2])) : (path = () => a[2]),
  (container = compile(a[1]), optional ?
    ctx => (container(ctx)?.[path(ctx)]?.(...args(ctx))) :
    ctx => (container(ctx)?.[path(ctx)](...args(ctx)))
  )
))


// a in b
set('in', PREC_COMP, (a, b) => a in b)

// literals
token('null', 20, a => a ? err() : [, null])
// token('undefined', 20, a => a ? err() : [, undefined])
// token('NaN', 20, a => a ? err() : [, NaN])


// right order
// '**', (a,prec,b=expr(PREC_EXP-1)) => ctx=>a(ctx)**b(ctx), PREC_EXP,
set('**', -PREC_EXP, (a, b) => a ** b)

export default subscript
export * from './subscript.js'
