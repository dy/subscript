import { asi, withASI } from '../util/asi.js'
import t from 'tst'
import { is } from 'tst'

t('asi: basic transform', () => {
  is(asi('a = 1\nb = 2'), 'a = 1; b = 2')
  is(asi('x = 1 +\n2'), 'x = 1 + 2')  // continuation
  is(asi('a'), 'a')  // single
  is(asi('a\nb\nc'), 'a; b; c')
  is(asi('for (i = 0; i < 5; i++) {\ni\n}'), 'for (i = 0; i < 5; i++) { i }')  // inside braces - no ;
})

t('asi: continuation detection', () => {
  is(asi('a = b\n.c'), 'a = b .c')  // . continues
  is(asi('a +\nb'), 'a + b')  // + continues
  is(asi('a(\n1, 2\n)'), 'a( 1, 2 )')  // inside parens - no ;
})

t('asi: multiline constructs', () => {
  // Arrays - no ; inside
  is(asi('x = [\n1,\n2\n]'), 'x = [ 1, 2 ]')
  is(asi('x = [\n1,\n2\n]\ny'), 'x = [ 1, 2 ]; y')
  // Objects - no ; inside
  is(asi('x = {\na: 1,\nb: 2\n}'), 'x = { a: 1, b: 2 }')
  // Nested
  is(asi('f(\n{\na: 1\n}\n)'), 'f( { a: 1 } )')
})

t('asi: template literals', () => {
  // Single line template
  is(asi('x = `a`\ny'), 'x = `a`; y')
  // Multiline template - no ; inside
  is(asi('x = `a\nb`\ny'), 'x = `a b`; y')
  // Template with expression
  is(asi('x = `${v}`\ny'), 'x = `${v}`; y')
})

t('asi: return/break/continue', () => {
  // JS ASI: newline after return inserts ;
  is(asi('return\nx'), 'return; x')
  is(asi('return x\ny'), 'return x; y')
})

t('asi: no trailing semicolon', () => {
  // Important: trailing ; makes subscript return undefined
  is(asi('a = 1').endsWith(';'), false)
  is(asi('a\nb').endsWith(';'), false)
})

t('asi: keepNewlines option', () => {
  is(asi('a = 1\nb = 2', { keepNewlines: true }), 'a = 1;\nb = 2')
})

t('asi: inline comments', () => {
  // Semicolon should be inserted BEFORE inline comment
  is(asi("x = 1 // comment\ny = 2"), 'x = 1; // comment y = 2')
  is(asi("x = 1 // comment\ny = 2", { keepNewlines: true }), 'x = 1; // comment\ny = 2')
  // String containing // should not be treated as comment
  is(asi('url = "http://x"\ny'), 'url = "http://x"; y')
})

// Integration with parser
import '../subscript.js'
import '../feature/var.js'
import '../feature/loop.js'
import '../feature/collection.js'
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
