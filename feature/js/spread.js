import { unary } from "../../src/parse.js";
import { PREC_PREFIX } from "../../src/const.js";
import { operator, compile } from "../../src/compile.js";

unary('...', PREC_PREFIX);
operator('...', (a) => (a = compile(a), ctx => Object.entries(a(ctx))));
