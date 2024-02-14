import { binary, err } from "../src/parse.js";
import { compile, operator } from "../src/compile.js";
import { PREC_ASSIGN } from "../src/const.js";

// assignments
binary('=', PREC_ASSIGN, true)
operator('=', (a, b) => {
  let calc = compile(b), container, path,
    set = typeof a === 'string' ? (ctx, v) => ctx[a] = v :
      a[0] === '.' ? (container = compile(a[1]), path = a[2], (ctx, v) => container(ctx)[path] = v) :
        a[0] === '[' ? (container = compile(a[1]), path = compile(a[2]), (ctx, v) => container(ctx)[path(ctx)] = v) :
          err('Bad left value');
  return ctx => set(ctx, calc(ctx))
})

// FIXME: add more assignments
