import { set } from '../src/index.js'
import { PREC_PREFIX } from '../src/const.js'

// unaries
set('+', PREC_PREFIX, a => +a)
set('-', PREC_PREFIX, a => -a)
set('!', PREC_PREFIX, a => !a)
