import { binary, err } from "../src/parse.js";
import { compile, operator, operators, access } from "../src/compile.js";
import { PREC_ASSIGN } from "../src/const.js";

// assignments
binary('=', PREC_ASSIGN, true)
operator('=', (a, b) => (
  b = compile(b),
  // a = x, ((a)) = x, a.b = x, a['b'] = x
  access(a, (container, path, ctx) => container(ctx)[path(ctx)] = b(ctx))
))
