// Demo: various parse error formats
import t from 'tst'
import { parse } from '../jessie.js'

t.demo('error formats', {only:true, bail:true}, () => {
  const cases = [
    // Unexpected token
    ['1 * * 2', 'double multiply (no unary *)'],
    ['a..b', 'double dot'],
    ['(a +)', 'trailing operator in group'],

    // Unclosed groups
    ['(a + b', 'unclosed paren'],
    ['[1, 2, 3', 'unclosed bracket'],
    ['{a: 1', 'unclosed brace'],
    ['`hello ${x', 'unclosed template'],

    // Unexpected end
    ['a +', 'trailing operator'],
    ['let x =', 'incomplete assignment'],

    // Invalid syntax
    ['function ()', 'anonymous function without arrow'],
    ['class { constructor }', 'incomplete class'],

    // Mismatched
    ['(a + b]', 'mismatched brackets'],
    ['[1, 2)', 'mismatched parens'],

    // Deep nesting error
    ['((((a + b)))', 'unclosed deep nesting'],

    // Long line error position
    ['let veryLongVariableName = anotherLongName + yetAnotherOne * andOneMore / plusThis - ', 'long line trailing op'],
  ]

  for (const [code, desc] of cases) {
    console.log(`--- ${desc} ---`)
    console.log(`Input: ${JSON.stringify(code)}`)
    try {
      const ast = parse(code)
      console.error('Parsed:', JSON.stringify(ast))
    } catch (e) {
      console.log(e)
    }
    console.log()
  }
})
