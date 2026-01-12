/**
 * Arithmetic operators: + - * / % ++ --
 */
import { binary, unary, token, expr } from '../src/parse.js'
import { PREC_ADD, PREC_MULT, PREC_PREFIX, PREC_POSTFIX, PREC_ASSIGN } from '../src/const.js'
import { compile, prop, operator } from '../src/compile.js'

// Addition / subtraction
binary('+', PREC_ADD), operator('+', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) + b(ctx)))
binary('-', PREC_ADD), operator('-', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) - b(ctx)))

// Unary + -
unary('+', PREC_PREFIX), operator('+', (a, b) => !b && (a = compile(a), ctx => +a(ctx)))
unary('-', PREC_PREFIX), operator('-', (a, b) => !b && (a = compile(a), ctx => -a(ctx)))

// Multiplication / division / modulo
binary('*', PREC_MULT), operator('*', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) * b(ctx)))
binary('/', PREC_MULT), operator('/', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) / b(ctx)))
binary('%', PREC_MULT), operator('%', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) % b(ctx)))

// Increment / decrement
token('++', PREC_POSTFIX, a => a ? ['++', a, null] : ['++', expr(PREC_POSTFIX - 1)])
operator('++', (a, b) => prop(a, b === null ? (obj, path) => obj[path]++ : (obj, path) => ++obj[path]))

token('--', PREC_POSTFIX, a => a ? ['--', a, null] : ['--', expr(PREC_POSTFIX - 1)])
operator('--', (a, b) => prop(a, b === null ? (obj, path) => obj[path]-- : (obj, path) => --obj[path]))

// Compound assignments
binary('+=', PREC_ASSIGN, true)
operator('+=', (a, b) => (b = compile(b), prop(a, (container, path, ctx) => container[path] += b(ctx))))

binary('-=', PREC_ASSIGN, true)
operator('-=', (a, b) => (b = compile(b), prop(a, (container, path, ctx) => container[path] -= b(ctx))))

binary('*=', PREC_ASSIGN, true)
operator('*=', (a, b) => (b = compile(b), prop(a, (container, path, ctx) => container[path] *= b(ctx))))

binary('/=', PREC_ASSIGN, true)
operator('/=', (a, b) => (b = compile(b), prop(a, (container, path, ctx) => container[path] /= b(ctx))))

binary('%=', PREC_ASSIGN, true)
operator('%=', (a, b) => (b = compile(b), prop(a, (container, path, ctx) => container[path] %= b(ctx))))
