import { set } from '../src/index.js'
import { PREC_MULT } from '../src/const.js'

set('*', PREC_MULT, (a, b) => a * b)
set('/', PREC_MULT, (a, b) => a / b)
set('%', PREC_MULT, (a, b) => a % b)
