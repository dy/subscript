import test, { is, throws } from 'tst'
import { parse, compile } from '../subscript.js'
import { unit } from '../feature/unit.js'

// Register units for tests
unit('px', 'em', 'rem', 'vh', 'vw', 'pt', 's', 'ms', 'deg', 'rad')

const run = (code, ctx = {}) => compile(parse(code))(ctx)

test('unit: basic', t => {
  is(parse('5px'), ['px', [, 5]])
  is(parse('10rem'), ['rem', [, 10]])
  is(parse('2.5s'), ['s', [, 2.5]])
})

test('unit: eval', t => {
  is(run('5px'), { value: 5, unit: 'px' })
  is(run('100vh'), { value: 100, unit: 'vh' })
  is(run('500ms'), { value: 500, unit: 'ms' })
})

test('unit: CSS lengths', t => {
  is(run('10em').unit, 'em')
  is(run('50vw').unit, 'vw')
  is(run('12pt').unit, 'pt')
})

test('unit: time', t => {
  is(run('2s'), { value: 2, unit: 's' })
  is(run('300ms'), { value: 300, unit: 'ms' })
})

test('unit: angles', t => {
  is(run('90deg'), { value: 90, unit: 'deg' })
  is(run('3.14rad'), { value: 3.14, unit: 'rad' })
})

test('unit: in expressions', t => {
  // Units should not affect normal operations when not applied
  is(run('5 + 3'), 8)
  is(run('px', { px: 10 }), 10) // px as identifier
})
