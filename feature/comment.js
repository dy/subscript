import { SPACE, STAR, PREC_TOKEN } from "../src/const.js"
import { token, skip, next, expr, idx, cur } from '../src/parse.js'

// /**/, // - note: || not && (continue unless */)
token('/*', PREC_TOKEN, (a, prec) => (next(c => c !== STAR || cur.charCodeAt(idx + 1) !== 47), skip(), skip(), a || expr(prec) || []))
token('//', PREC_TOKEN, (a, prec) => (next(c => c >= SPACE), a || expr(prec) || []))
