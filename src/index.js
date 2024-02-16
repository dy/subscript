import { parse, nary, binary, unary } from "./parse.js";
import { compile, operator } from "./compile.js";

// set any operator
// right assoc is indicated by negative precedence (meaning go from right to left)
export const set = (op, prec, fn) => (
  !fn.length ? (
    nary(op, Math.abs(prec), prec < 0),
    operator(op, (...args) => (args = args.map(compile), ctx => fn(...args.map(arg => arg(ctx)))))
  ) :
    fn.length > 1 ? (
      binary(op, Math.abs(prec), prec < 0),
      operator(op,
        (a, b) => b && (a = compile(a), b = compile(b), !a.length && !b.length ? (a = fn(a(), b()), () => a) : ctx => fn(a(ctx), b(ctx)))
      )
    ) :
      (
        unary(op, prec),
        operator(op, (a, b) => !b && (a = compile(a), !a.length ? (a = fn(a()), () => a) : ctx => fn(a(ctx))))
      )
)

export default s => compile(parse(s));
