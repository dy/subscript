import { PREC_LOR, PREC_LAND, PREC_PREFIX } from '../src/const.js';
import { unary, binary, nary } from "../src/parse.js"
import { operator, compile } from "../src/compile.js"

unary('!', PREC_PREFIX), operator('!', (a, b) => !b && (a = compile(a), ctx => !a(ctx)))

nary('||', PREC_LOR), operator('||', (...args) => (
  args = args.map(compile),
  ctx => { let arg, res; for (arg of args) if (res = arg(ctx)) return res; return res }
))

nary('&&', PREC_LAND), operator('&&', (...args) => (
  args = args.map(compile),
  ctx => { let arg, res; for (arg of args) if (!(res = arg(ctx))) return res; return res }
))
