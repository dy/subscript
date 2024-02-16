import { set } from '../src/index.js'
import { binary } from '../src/parse.js'
import { operator, compile, access } from '../src/compile.js'
import { PREC_MULT, PREC_ASSIGN } from '../src/const.js'

set('*', PREC_MULT, (a, b) => a * b)
set('/', PREC_MULT, (a, b) => a / b)
set('%', PREC_MULT, (a, b) => a % b)

binary('*=', PREC_ASSIGN, true)
operator('*=', (a, b) => (
  b = compile(b),
  access(a, (container, path, ctx) => container(ctx)[path(ctx)] *= b(ctx))
))

binary('/=', PREC_ASSIGN, true)
operator('/=', (a, b) => (
  b = compile(b),
  access(a, (container, path, ctx) => container(ctx)[path(ctx)] /= b(ctx))
))

binary('%=', PREC_ASSIGN, true)
operator('%=', (a, b) => (
  b = compile(b),
  access(a, (container, path, ctx) => container(ctx)[path(ctx)] %= b(ctx))
))
