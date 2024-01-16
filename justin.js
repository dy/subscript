// justin lang https://github.com/endojs/Jessie/issues/66
import { skip, cur, idx, err, expr, lookup, token } from './parse.js'
import compile, { operator } from './compile.js'
import subscript, { set } from './subscript.js'

const PERIOD = 46, OPAREN = 40, CPAREN = 41, OBRACK = 91, CBRACK = 93, SPACE = 32, DQUOTE = 34, QUOTE = 39, _0 = 48, _9 = 57, BSLASH = 92,
  PREC_SEQ = 1, PREC_COND = 3, PREC_SOME = 4, PREC_EVERY = 5, PREC_OR = 6, PREC_XOR = 7, PREC_AND = 8,
  PREC_EQ = 9, PREC_COMP = 10, PREC_SHIFT = 11, PREC_SUM = 12, PREC_MULT = 13, PREC_EXP = 14, PREC_UNARY = 15, PREC_POSTFIX = 16, PREC_CALL = 18, PREC_GROUP = 19

let escape = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' },
  string = q => (qc, c, str = '') => {
    qc && err('Unexpected string') // must not follow another token
    skip() // first quote
    while (c = cur.charCodeAt(idx), c - q) {
      if (c === BSLASH) skip(), c = skip(), str += escape[c] || c
      else str += skip()
    }
    skip() || err('Bad string')
    return ['', str]
  }

// operators
set('===', PREC_EQ, (a, b) => a === b)
set('!==', PREC_EQ, (a, b) => a !== b)
set('~', PREC_UNARY, (a) => ~a)

// ?:
token('?', PREC_COND, (a, b, c) => a && (b = expr(2, 58)) && (c = expr(3), ['?', a, b, c]))
operator('?', (a, b, c) => (a = compile(a), b = compile(b), c = compile(c), ctx => a(ctx) ? b(ctx) : c(ctx)))

set('??', PREC_OR, (a, b) => a ?? b)

// a?.[, a?.( - postfix operator
token('?.', PREC_CALL, a => a && ['?.', a])
operator('?.', a => (a = compile(a), ctx => a(ctx) || (() => { })))

// a?.b, a?.() - optional chain operator
token('?.', PREC_CALL, (a, b) => a && (b = expr(PREC_CALL), !b?.map) && (b ? ['?.', a, b] : ['?.', a, b]))
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

// "' with /
lookup[DQUOTE] = string(DQUOTE)
lookup[QUOTE] = string(QUOTE)

// /**/, //
token('/*', 20, (a, prec) => (skip(c => c !== 42 && cur.charCodeAt(idx + 1) !== 47), skip(2), a || expr(prec) || ['']))
token('//', 20, (a, prec) => (skip(c => c >= 32), a || expr(prec) || ['']))

// literals
token('null', 20, a => a ? err() : ['', null])
token('true', 20, a => a ? err() : ['', true])
token('false', 20, a => a ? err() : ['', false])
token('undefined', 20, a => a ? err() : ['', undefined])

// FIXME: make sure that is right
set(';', -20, (...args) => { for (let i = args.length; i--;) if (args[i] != null) return args[i] })

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
