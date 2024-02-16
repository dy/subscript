import { set } from '../src/index.js'
import { binary } from '../src/parse.js'
import { PREC_ADD, PREC_PREFIX, PREC_ASSIGN } from '../src/const.js'
import { compile, access, operator } from '../src/compile.js'

set('+', PREC_PREFIX, a => +a)
set('-', PREC_PREFIX, a => -a)

set('+', PREC_ADD, (a, b) => a + b)
set('-', PREC_ADD, (a, b) => a - b)

binary('+=', PREC_ASSIGN, true)
operator('+=', (a, b) => (
  b = compile(b),
  access(a, (container, path, ctx) => container(ctx)[path(ctx)] += b(ctx))
))

binary('-=', PREC_ASSIGN, true)
operator('-=', (a, b) => (
  b = compile(b),
  access(a, (container, path, ctx) => (container(ctx)[path(ctx)] -= b(ctx)))
))
