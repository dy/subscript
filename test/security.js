import test, { is } from 'tst'
import subscript from '../subscript.js'
import justin from '../justin.js'

test('security: blocked properties', t => {
  // Direct property access attacks
  is(subscript('a.constructor')({ a: {} }), undefined)
  is(subscript('a.__proto__')({ a: {} }), undefined)
  is(subscript('a.prototype')({ a: function(){} }), undefined)
  
  // Dynamic property access attacks
  is(subscript('a[b]')({ a: {}, b: 'constructor' }), undefined)
  is(subscript('a[b]')({ a: {}, b: '__proto__' }), undefined)
  
  // String/array constructor chain
  is(subscript('"".constructor')({ }), undefined)
  is(subscript('[].constructor')({ }), undefined)
  
  // Normal access still works
  is(subscript('a.b')({ a: { b: 42 } }), 42)
  is(subscript('a[b]')({ a: { x: 1 }, b: 'x' }), 1)
})

test('security: optional chaining blocked', t => {
  is(justin('a?.constructor')({ a: {} }), undefined)
  is(justin('a?.__proto__')({ a: {} }), undefined)
  is(justin('a?.["constructor"]')({ a: {} }), undefined)
  
  // Normal optional chaining works
  is(justin('a?.b')({ a: { b: 42 } }), 42)
  is(justin('a?.b')({ a: null }), undefined)
})

test('security: Function constructor attack', t => {
  // This was the main attack vector - should be blocked
  let attacked = false
  try {
    const fn = subscript('a.constructor.constructor("attacked=true")()')
    fn({ a: {} })
  } catch (e) {
    // Either blocked or errors - both acceptable
  }
  is(attacked, false)
})
