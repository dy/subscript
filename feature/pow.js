import { binary } from "../src/parse.js";
import { compile, operator, prop } from "../src/compile.js";
import { PREC_EXP, PREC_ASSIGN } from "../src/const.js";

binary('**', PREC_EXP, true), operator('**', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) ** b(ctx)));
binary('**=', PREC_ASSIGN, true), operator('**=', (a, b) => (b = compile(b), prop(a, (obj, path, ctx) => (obj[path] **= b(ctx)))));
