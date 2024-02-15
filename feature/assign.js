import { binary, err } from "../src/parse.js";
import { compile, operator, operators, access } from "../src/compile.js";
import { PREC_ASSIGN } from "../src/const.js";

// assignments
binary('=', PREC_ASSIGN, true)
operator('=', (a, b) => (
  b = compile(b),
  access(a,
    // a = x, ((a)) = x
    (_, path, ctx) => ctx[path] = b(ctx),
    // a.b = x
    (container, path, ctx) => container(ctx)[path] = b(ctx),
    // a['b'] = x
    (container, path, ctx) => container(ctx)[path(ctx)] = b(ctx),
    // !a = x
    () => err('Bad assignment left side')
  )
))
