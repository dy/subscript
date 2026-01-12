/**
 * Collection literals: arrays and objects (Justin feature)
 *
 * [a, b, c]
 * {a: 1, b: 2}
 * {a, b} (shorthand)
 */
import { group, binary } from '../src/parse.js'
import { operator, compile } from '../src/compile.js'
import { PREC_ASSIGN, PREC_TOKEN } from '../src/const.js'

// [a,b,c]
group('[]', PREC_TOKEN)
operator('[]', (a, b) => b === undefined && (
  a = !a ? [] : a[0] === ',' ? a.slice(1) : [a],
  a = a.map(a => a[0] === '...' ? (a = compile(a[1]), ctx => a(ctx)) : (a = compile(a), ctx => [a(ctx)])),
  ctx => a.flatMap(a => a(ctx))
))

// {a:1, b:2, c:3}
group('{}', PREC_TOKEN)
operator('{}', (a, b) => b === undefined && (
  a = !a ? [] : a[0] !== ',' ? [a] : a.slice(1),
  a = a.map(p => compile(typeof p === 'string' ? [':', p, p] : p)),
  ctx => Object.fromEntries(a.flatMap(frag => frag(ctx)))
))

// a: b (colon operator for object properties)
binary(':', PREC_ASSIGN - 1, true)
operator(':', (a, b) => (b = compile(b), Array.isArray(a) ? (a = compile(a), ctx => [[a(ctx), b(ctx)]]) : ctx => [[a, b(ctx)]]))
