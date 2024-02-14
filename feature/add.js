import { set } from '../src/index.js'
import { PREC_ADD } from '../src/const.js'

set('+', PREC_ADD, (a, b) => a + b)
set('-', PREC_ADD, (a, b) => a - b)
