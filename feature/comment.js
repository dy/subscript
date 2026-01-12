import { SPACE, STAR, PREC_TOKEN } from "../src/const.js"
import { token, skip, next, cur, idx, expr } from "../src/parse.js"

// /**/, //
token('/*', PREC_TOKEN, (a, prec) => (next(c => c !== STAR && cur.charCodeAt(idx + 1) !== 47), skip(),skip(), a || expr(prec) || []))
token('//', PREC_TOKEN, (a, prec) => (next(c => c >= SPACE), a || expr(prec) || []))
