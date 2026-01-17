// Security tests

import test, { is, throws } from 'tst'
import '../jessie.js'
import { parse, compile } from '../parse.js'
import { unsafe } from '../feature/access.js'

const c = (s, ctx = {}) => compile(parse(s))(ctx)

test('security: blocked constructor', () => {
  // Blocked properties return undefined instead of actual value
  is(c('[].constructor'), undefined)
  is(c('"".constructor'), undefined)
  is(c('({}).constructor'), undefined)
})

test('security: blocked prototype', () => {
  is(c('[].prototype'), undefined)
  is(c('({}).prototype'), undefined)
})

test('security: blocked __proto__', () => {
  is(c('({}).__proto__'), undefined)
  is(c('[].__proto__'), undefined)
})

test('security: unsafe checker', () => {
  is(unsafe('constructor'), true)
  is(unsafe('prototype'), true)
  is(unsafe('__proto__'), true)
  is(unsafe('normal'), false)
  is(unsafe('x'), false)
})
