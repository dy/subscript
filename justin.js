// justin lang https://github.com/endojs/Jessie/issues/66
import { skip, cur, idx, err, expr, lookup, token, binary } from './src/parse.js'
import compile, { operator } from './src/compile.js'
import subscript, { set } from './src/index.js'
import { PREC_ASSIGN, PREC_PREFIX, PREC_OR, PREC_ACCESS, PREC_COMP, PREC_EXP } from './src/const.js'

// register subscript operators set
import './subscript.js'


// operators
// set('===', PREC_EQ, (a, b) => a === b)
// set('!==', PREC_EQ, (a, b) => a !== b)
set('~', PREC_PREFIX, (a) => ~a)

// ?:
token('?', PREC_ASSIGN, (a, b, c) => a && (b = expr(2, 58)) && (c = expr(3), ['?', a, b, c]))
operator('?', (a, b, c) => (a = compile(a), b = compile(b), c = compile(c), ctx => a(ctx) ? b(ctx) : c(ctx)))

set('??', PREC_OR, (a, b) => a ?? b)

// a?.[, a?.( - postfix operator
token('?.', PREC_ACCESS, a => a && ['?.', a])
operator('?.', a => (a = compile(a), ctx => a(ctx) || (() => { })))

// a?.b, a?.() - optional chain operator
token('?.', PREC_ACCESS, (a, b) => a && (b = expr(PREC_ACCESS), !b?.map) && (b ? ['?.', a, b] : ['?.', a, b]))
operator('?.', (a, b) => b && (a = compile(a), ctx => a(ctx)?.[b]))

// a?.x() - keep context, but watch out a?.()
operator('(', (a, b, container, args, path, optional) => (b != null) && (a[0] === '?.') && (a[2] || Array.isArray(a[1])) && (
  args = b == '' ? () => [] : // a()
    b[0] === ',' ? (b = b.slice(1).map(compile), ctx => b.map(a => a(ctx))) : // a(b,c)
      (b = compile(b), ctx => [b(ctx)]), // a(b)
  // a?.()
  !a[2] && (optional = true, a = a[1]),
  // a?.['x']?.()
  a[0] === '[' ? (path = compile(a[2])) : (path = ctx => a[2]),
  (container = compile(a[1]), optional ?
    ctx => (container(ctx)?.[path(ctx)]?.(...args(ctx))) :
    ctx => (container(ctx)?.[path(ctx)](...args(ctx)))
  )
))

// a in b
set('in', PREC_COMP, (a, b) => a in b)

// /**/, //
token('/*', 20, (a, prec) => (skip(c => c !== 42 && cur.charCodeAt(idx + 1) !== 47), skip(2), a || expr(prec) || ['']))
token('//', 20, (a, prec) => (skip(c => c >= 32), a || expr(prec) || ['']))

// literals
token('null', 20, a => a ? err() : ['', null])
token('true', 20, a => a ? err() : ['', true])
token('false', 20, a => a ? err() : ['', false])
// token('undefined', 20, a => a ? err() : ['', undefined])
// token('NaN', 20, a => a ? err() : ['', NaN])

set(';', -1, (...args) => args[args.length - 1])

// right order
// '**', (a,prec,b=expr(PREC_EXP-1)) => ctx=>a(ctx)**b(ctx), PREC_EXP,
set('**', -PREC_EXP, (a, b) => a ** b)

// [a,b,c]
token('[', 20, (a) => !a && ['[', expr(0, 93) || ''])
operator('[', (a, b) => !b && (
  !a ? () => [] : // []
    a[0] === ',' ? (a = a.slice(1).map(compile), ctx => a.map(a => a(ctx))) : // [a,b,c]
      (a = compile(a), ctx => [a(ctx)]) // [a]
))

// {a:1, b:2, c:3}
token('{', 20, a => !a && (['{', expr(0, 125) || '']))
operator('{', (a, b) => (
  !a ? ctx => ({}) : // {}
    a[0] === ',' ? (a = a.slice(1).map(compile), ctx => Object.fromEntries(a.map(a => a(ctx)))) : // {a:1,b:2}
      a[0] === ':' ? (a = compile(a), ctx => Object.fromEntries([a(ctx)])) : // {a:1}
        (b = compile(a), ctx => ({ [a]: b(ctx) }))
))

token(':', 1.1, (a, b) => (b = expr(1.1) || err(), [':', a, b]))
operator(':', (a, b) => (b = compile(b), a = Array.isArray(a) ? compile(a) : (a => a).bind(0, a), ctx => [a(ctx), b(ctx)]))

export default subscript
export * from './subscript.js'
