import { binary } from '../src/parse.js'
import { operator, compile, prop } from '../src/compile.js'
import { PREC_MULT, PREC_ASSIGN } from '../src/const.js'

binary('*', PREC_MULT), operator('*', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) * b(ctx)))
binary('/', PREC_MULT), operator('/', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) / b(ctx)))
binary('%', PREC_MULT), operator('%', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) % b(ctx)))

binary('*=', PREC_ASSIGN, true)
operator('*=', (a, b) => (
  b = compile(b),
  prop(a, (container, path, ctx) => container(ctx)[path(ctx)] *= b(ctx))
))

binary('/=', PREC_ASSIGN, true)
operator('/=', (a, b) => (
  b = compile(b),
  prop(a, (container, path, ctx) => container(ctx)[path(ctx)] /= b(ctx))
))

binary('%=', PREC_ASSIGN, true)
operator('%=', (a, b) => (
  b = compile(b),
  prop(a, (container, path, ctx) => container(ctx)[path(ctx)] %= b(ctx))
))
