import { set } from '../src/index.js'
import { PREC_OR, PREC_AND, PREC_SHIFT, PREC_XOR } from "../src/const.js"

set('|', PREC_OR, (a, b) => a | b)
set('&', PREC_AND, (a, b) => a & b)
set('^', PREC_XOR, (a, b) => a ^ b)
set('>>', PREC_SHIFT, (a, b) => a >> b)
set('>>>', PREC_SHIFT, (a, b) => a >>> b)
set('<<', PREC_SHIFT, (a, b) => a << b)
