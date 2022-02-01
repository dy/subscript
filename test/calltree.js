import test, {is, any, throws} from 'tst'
import parse, { skip, expr, token, err, cur, idx } from '../parser.js'

const PREC_SUM=12, PREC_MULT=13

token('+', (a, b) => (b=expr(PREC_SUM), ['+', a, b]), PREC_SUM)
token('-', (a, b) => (b=expr(PREC_SUM), ['-', a, b]), PREC_SUM)

test('Define custom parser', () => {
  is(parse('a + b'), ['+', 'a', 'b'])
  is(parse('a + b - c'), ['-', ['+', 'a', 'b'], 'c'])
})
