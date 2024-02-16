import { binary } from "../src/parse.js";
import { compile, operator } from "../src/compile.js";
import { PREC_COMP } from "../src/const.js";

// a in b
binary('in', PREC_COMP), operator('in', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) in b(ctx)))
