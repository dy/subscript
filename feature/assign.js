import { binary, err } from "../src/parse.js";
import { compile, operator, operators } from "../src/compile.js";
import { PREC_ASSIGN } from "../src/const.js";

// assignments
binary('=', PREC_ASSIGN, true)
operator('=', (a, b) => {
  let calc = compile(b), container, path

  return typeof a === 'string' ? (ctx) => ctx[a] = calc(ctx) :
    a[0] === '.' ? (container = compile(a[1]), path = a[2], (ctx) => container(ctx)[path] = calc(ctx)) :
      a[0] === '[' ? (container = compile(a[1]), path = compile(a[2]), (ctx) => container(ctx)[path(ctx)] = calc(ctx)) :
        err('Bad left value');
})
