import { PREC_EQ, PREC_COMP } from '../src/const.js'
import { unary, binary } from "../src/parse.js"
import { operator, compile } from "../src/compile.js"


binary('==', PREC_EQ), operator('==', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) == b(ctx)))
binary('!=', PREC_EQ), operator('!=', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) != b(ctx)))
binary('>', PREC_COMP), operator('>', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) > b(ctx)))
binary('<', PREC_COMP), operator('<', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) < b(ctx)))
binary('>=', PREC_COMP), operator('>=', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) >= b(ctx)))
binary('<=', PREC_COMP), operator('<=', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) <= b(ctx)))
