import { asi, withASI } from '../feature/asi.js'
import t from 'tst'
import { is } from 'tst'

t('asi: basic transform', () => {
  is(asi('a = 1\nb = 2'), 'a = 1; b = 2')
  is(asi('x = 1 +\n2'), 'x = 1 + 2')  // continuation
  is(asi('a'), 'a')  // single
  is(asi('a\nb\nc'), 'a; b; c')
  is(asi('for (i = 0; i < 5; i++) {\ni\n}'), 'for (i = 0; i < 5; i++) { i; }')
})

t('asi: continuation detection', () => {
  is(asi('a = b\n.c'), 'a = b .c')  // . continues
  is(asi('a +\nb'), 'a + b')  // + continues
  is(asi('a(\n1, 2\n)'), 'a( 1, 2; )')  // ( continues (note: inner ; is quirk)
})

t('asi: no trailing semicolon', () => {
  // Important: trailing ; makes subscript return undefined
  is(asi('a = 1').endsWith(';'), false)
  is(asi('a\nb').endsWith(';'), false)
})

t('asi: keepNewlines option', () => {
  is(asi('a = 1\nb = 2', { keepNewlines: true }), 'a = 1;\nb = 2')
})

// Integration with parser
import '../subscript.js'
import '../feature/var.js'
import '../feature/loop.js'
import '../feature/array.js'
import { parse, compile } from '../subscript.js'

t('asi: parse integration', () => {
  const asiParse = withASI(parse)

  const run = (src) => {
    const tree = asiParse(src)
    return compile(tree)({})
  }

  is(run('a = 1\nb = 2\na + b'), 3)
  is(run('x = 5\ny = x * 2\ny'), 10)
  is(run('sum = 0\nfor (i = 1; i <= 3; i++) sum = sum + i\nsum'), 6)
})
