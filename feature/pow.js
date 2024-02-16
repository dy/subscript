import { binary } from "../src/parse.js";
import { compile, operator } from "../src/compile.js";
import { PREC_EXP } from "../src/const.js";

binary('**', PREC_EXP, true), operator('**', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) ** b(ctx)))
