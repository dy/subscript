/**
 * Shift operators: << >> with assignments
 * Note: Must be imported AFTER comparison operators (>, <) for correct parsing
 */
import { PREC_SHIFT, PREC_ASSIGN } from "../src/const.js"
import { binary } from "../src/parse.js"
import { operator, compile, prop } from "../src/compile.js"

binary('>>', PREC_SHIFT), operator('>>', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) >> b(ctx)))
binary('<<', PREC_SHIFT), operator('<<', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) << b(ctx)))

binary('>>=', PREC_ASSIGN, true)
operator('>>=', (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] >>= b(ctx))))

binary('<<=', PREC_ASSIGN, true)
operator('<<=', (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => obj[path] <<= b(ctx))))
