
import { binary, unary } from '../src/parse.js'
import { PREC_ADD, PREC_PREFIX, PREC_ASSIGN } from '../src/const.js'
import { compile, prop, operator } from '../src/compile.js'

binary('+', PREC_ADD), operator('+', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) + b(ctx)))
binary('-', PREC_ADD), operator('-', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) - b(ctx)))

binary('+=', PREC_ASSIGN, true)
operator('+=', (a, b) => (
  b = compile(b),
  prop(a, (container, path, ctx) => container[path] += b(ctx))
))

binary('-=', PREC_ASSIGN, true)
operator('-=', (a, b) => (
  b = compile(b),
  prop(a, (container, path, ctx) => (container[path] -= b(ctx)))
))

unary('+', PREC_PREFIX), operator('+', (a, b) => !b && (a = compile(a), ctx => +a(ctx)))
unary('-', PREC_PREFIX), operator('-', (a, b) => !b && (a = compile(a), ctx => -a(ctx)))
