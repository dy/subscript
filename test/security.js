// Security tests

import test, { is, throws } from 'tst'
import '../jessie.js'
import { parse, compile } from '../parse.js'
import { prop, unsafe } from '../eval/access.js'

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
  is(unsafe('__x'), true)
  is(unsafe('_x'), false)
  is(unsafe(['constructor']), true)
  is(unsafe({ toString: () => 'constructor' }), true)
  is(unsafe('normal'), false)
  is(unsafe('x'), false)
})

test('security: minimal prop runtime uses guarded access', async () => {
  const minimal = await import('../eval/prop.js')
  is(minimal.unsafe, unsafe)
  is(minimal.prop, prop)
})

test('security: blocked bare identifiers', () => {
  is(c('constructor'), undefined)
  is(c('constructor', { constructor: 1 }), undefined)
  is(c('prototype'), undefined)
  is(c('__proto__'), undefined)
})

test('security: blocked calls', () => {
  let called = false, argCalled = false
  const ctx = {
    a: { constructor() { called = true } },
    arg() { argCalled = true }
  }
  is(c('constructor()', { constructor() { called = true } }), undefined)
  is(c('a.constructor(arg())', ctx), undefined)
  is(c('(a.constructor)()', ctx), undefined)
  is(c('a["constructor"]()', ctx), undefined)
  for (ctx.key of ['constructor', ['constructor'], { toString: () => 'constructor' }, { [Symbol.toPrimitive]: () => 'constructor' }])
    is(c('a[key]()', ctx), undefined)
  is(called, false)
  is(argCalled, false)

  // Coerce once: a stateful key cannot pass as safe, then become blocked.
  let coercions = 0, safeCalled = false
  ctx.a.x = () => { safeCalled = true }
  ctx.key = { toString: () => coercions++ ? 'constructor' : 'x' }
  c('a[key]()', ctx)
  is(coercions, 1)
  is(safeCalled, true)
  is(called, false)

  // Missing safe methods retain normal TypeError behavior.
  throws(() => c('a.missing()', ctx), TypeError)
})

test('security: optional access preserves short-circuiting', () => {
  let called = false, keyCalls = 0
  const ctx = {
    nil: null,
    a: { constructor() { called = true } },
    key() { keyCalls++; return 'constructor' },
    safeKey() { keyCalls++; return 'value' }
  }
  throws(() => c('nil.value?.()', ctx), TypeError)
  throws(() => c('nil[safeKey()]?.()', ctx), TypeError)
  is(keyCalls, 1)
  keyCalls = 0
  is(c('nil?.[key()]', ctx), undefined)
  is(c('nil?.[key]?.()', ctx), undefined)
  is(keyCalls, 0)
  is(c('a?.constructor()', ctx), undefined)
  is(c('a?.[key()]()', ctx), undefined)
  is(c('a?.[key()]?.()', ctx), undefined)
  is(keyCalls, 2)
  is(called, false)
})

test('security: safe key boundaries preserve property semantics', () => {
  const symbol = Symbol('value')
  const primitive = () => symbol
  primitive.call = () => 'constructor'
  const ctx = {
    value: { '': 1, 0: 2, null: 3, [symbol]: 4 },
    empty: '', zero: 0, nil: null, symbol,
    boxed: Object(symbol),
    symbolic: { toString: () => symbol },
    exotic: { [Symbol.toPrimitive]: primitive },
    invalid: { toString: () => ({}), valueOf: () => ({}) }
  }
  is(c('value[empty]', ctx), 1)
  is(c('value[zero]', ctx), 2)
  is(c('value[nil]', ctx), 3)
  is(c('value[symbol]', ctx), 4)
  is(c('value[boxed]', ctx), 4)
  is(c('value[symbolic]', ctx), 4)
  is(c('value[exotic]', ctx), 4)
  throws(() => c('value[invalid]', ctx), TypeError)
})

test('security: base-less classes do not expose Object statics', () => {
  const ctx = {}
  const Class = c('class X {}; X', ctx)
  is(Object.getPrototypeOf(Class), Function.prototype)
  is(c('new X() instanceof X', ctx), true)
  is(c('X.getPrototypeOf', ctx), undefined)
  is(c('X.getOwnPropertyDescriptor', ctx), undefined)
  is(c('class Y { value() { return super } }; (new Y()).value()', {}), undefined)

  function Parent() {}
  const Child = c('class Child extends Parent { value() { return super } }; Child', { Parent })
  is(Object.getPrototypeOf(Child), Parent)
  is(Object.getPrototypeOf(Child.prototype), Parent.prototype)
  is(c('new Child() instanceof Parent', { Child, Parent }), true)
  is(c('(new Child()).value()', { Child }), Parent)
})

test('security: assignment cannot alias constructors', () => {
  const ctx = { f() {}, key: 'constructor' }
  is(c('f.constructor ||= 0', ctx), undefined)
  is(c('f["constructor"] ??= 0', ctx), undefined)
  is(c('f[key] ||= 0', ctx), undefined)
})

test('security: destructuring cannot alias constructors', () => {
  let blockedRead = false
  const source = {}
  Object.defineProperty(source, 'constructor', { get() { blockedRead = true; return {} } })
  is(c('let {constructor: F} = f; F', { f() {} }), undefined)
  is(c('let {constructor: C} = {}; C', {}), undefined)
  is(c('let {constructor: C} = source; C', { source }), undefined)
  is(blockedRead, false)
})

test('security: object rest and spread omit blocked keys', () => {
  let blockedRead = false
  const source = { safe: 1 }
  for (const key of ['constructor', 'prototype', '__proto__'])
    Object.defineProperty(source, key, { enumerable: true, get() { blockedRead = true; return {} } })

  const rest = c('let {...rest} = source; rest', { source })
  const spread = c('({...source})', { source })
  is(blockedRead, false)
  is(Object.keys(rest).join(','), 'safe')
  is(Object.keys(spread).join(','), 'safe')
  is(rest.safe, 1)
  is(spread.safe, 1)
})
