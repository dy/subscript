import { SPACE, STAR, PREC_TOKEN } from "../src/const.js"
import { token, skip, next, cur, idx, expr } from "../src/parse.js"

// /**/, //
// FIXME: try replacing with group
token('/*', PREC_TOKEN, (a, prec) => (next(c => c !== STAR && cur.charCodeAt(idx + 1) !== 47), skip(2), a || expr(prec) || []))
token('//', PREC_TOKEN, (a, prec) => (next(c => c >= SPACE), a || expr(prec) || []))
