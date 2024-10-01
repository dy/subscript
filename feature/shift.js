import { PREC_OR, PREC_AND, PREC_SHIFT, PREC_XOR, PREC_PREFIX, PREC_ASSIGN } from "../src/const.js"
import { unary, binary } from "../src/parse.js"
import { operator, compile } from "../src/compile.js"


binary('>>', PREC_SHIFT), operator('>>', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) >> b(ctx)))
binary('<<', PREC_SHIFT), operator('<<', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) << b(ctx)))

binary('>>=', PREC_ASSIGN, true)
operator('>>=', (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => (obj[path] >>= b(ctx)))))
binary('<<=', PREC_ASSIGN, true)
operator('<<=', (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => (obj[path] <<= b(ctx)))))
