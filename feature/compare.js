import { set } from '../src/index.js'
import { PREC_EQ } from '../src/const.js'

set('==', PREC_EQ, (a, b) => a == b)
set('!=', PREC_EQ, (a, b) => a != b)
set('>', PREC_EQ, (a, b) => a > b)
set('>=', PREC_EQ, (a, b) => a >= b)
set('<', PREC_EQ, (a, b) => a < b)
set('<=', PREC_EQ, (a, b) => a <= b)
