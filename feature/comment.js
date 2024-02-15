import { SPACE, STAR, PREC_MAX } from "../src/const.js"
import { token } from "../src/parse.js"

// /**/, //
token('/*', PREC_MAX, (a, prec) => (skip(c => c !== STAR && cur.charCodeAt(idx + 1) !== 47), skip(2), a || expr(prec) || ['']))
token('//', PREC_MAX, (a, prec) => (skip(c => c >= SPACE), a || expr(prec) || ['']))
