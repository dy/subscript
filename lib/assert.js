import {current} from './test.js'

export function ok(value, msg = 'should be truthy') {
  if (Boolean(value)) return current?.pass({operator: 'ok', message: msg})

  throw new Assertion({
    operator: 'ok',
    message: msg,
    actual: value,
    expects: true
  })
}

export function is(a, b, msg = 'should be the same') {
  if (isPrimitive(a) || isPrimitive(b) ? (a == b) : deq(a, b)) return current?.pass({operator: 'is', message: msg})

  throw new Assertion({
    operator: 'is',
    message: msg,
    actual: slice(a),
    expects: slice(b)
  })
}

export function not(a, b, msg = 'should be different') {
  if (isPrimitive(a) || isPrimitive(b) ? !(a == b) : !deq(a, b)) return current?.pass({operator: 'not', message: msg})

  throw new Assertion({
    operator: 'is not',
    message: msg,
    actual: slice(a),
    // this contraption makes chrome debugger display nicer
    expects: new class Not { constructor(a){this.actual = a}  }(a)
  })
}

export function same(a, b, msg = 'should have same members') {
  if (sameMembers(a, b)) return current?.pass({operator: 'same', message: msg})

  throw new Assertion({
    operator: 'same',
    message: msg,
    actual: a,
    expects: b
  })
}

export function any(a, ...list) {
  if (list.some(b => isPrimitive(a) || isPrimitive(b) ? (a == b) : deq(a, b)))
    return current?.pass({ operator: 'any', message: 'any of' })

  throw new Assertion({
    operator: 'any',
    message: 'shoul be any of',
    actual: slice(a),
    expects: new (class Any extends Array { })(...list.map(b => slice(b)))
  })
}

export function almost (a, b, eps = 1.19209290e-7, msg = 'should almost equal') {
  if (
    isPrimitive(a) || isPrimitive(b) ? almostEqual(a, b, eps) :
    [...a].every((a0, i) => a0 === b[i] || almostEqual(a0, b[i], eps))
  ) return current?.pass({operator: 'almost', message: msg})

  throw new Assertion({
    operator: 'almost',
    message: msg,
    actual: slice(a),
    expects: slice(b)
  })
}

export function throws(fn, expects, msg = 'should throw') {
  try {
    fn()
    throw new Assertion({operator: 'throws', message: msg, expects})
  } catch (err) {
    if (expects instanceof Error) {
      if (err.name === expects.name) return current?.pass({operator: 'throws', message: msg})
      throw new Assertion({
        operator: 'throws',
        message: msg,
        actual: err.name,
        expects: expects.name
      })
    } else if (expects instanceof RegExp) {
      if (expects.test(err.toString())) return current?.pass({operator: 'throws', message: msg})
      throw new Assertion({
        operator: 'throws',
        message: msg,
        actual: err.toString(),
        expects: expects
      })
    } else if (typeof expects === 'function') {
      if (expects(err)) return current?.pass({operator: 'throws', message: msg})
      throw new Assertion({
        operator: 'throws',
        message: msg,
        actual: err
      })
    }
    return current?.pass({operator: 'throws', message: msg})
  }
}

function deq (a, b) {
  if (a == b) return true
  if (a && b) {
    if (a.constructor === b.constructor) {
      if (a.constructor === RegExp) return a.toString() === b.toString()
      if (a.constructor === Date) return a.getTime() === b.getTime()
      if (a.constructor === Array) return a.length === b.length && a.every((a, i) => deq(a, b[i]))
      if (a.constructor === Object) return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => deq(a[key], b[key]))
    }
    if (!isPrimitive(a) && a[Symbol.iterator] && b[Symbol.iterator]) return deq([...a], [...b])
  }
  return a !== a && b !== b
}

function isPrimitive(val) {
  return (typeof val === 'object') ? val === null : typeof val !== 'function';
}

function almostEqual(a, b, eps) {
  if (eps === undefined) {
    eps = Math.min(
      Math.max(
        Math.abs(a - new Float32Array([a])[0]),
        Math.abs(b - new Float32Array([b])[0])
      ),
      1.19209290e-7
    )
  }

  var d = Math.abs(a - b)

  if (d <= eps) return true

  return a === b
}

function sameMembers(a, b) {
  a = Array.from(a), b = Array.from(b)

  if (a.length !== b.length) return false;

  if (!b.every(function (item) {
    var idx = a.indexOf(item);
    if (idx < 0) return false;
    a.splice(idx, 1);
    return true;
  })) return false;

  if (a.length) return false;

  return true;
}

const slice = a => isPrimitive(a) ? a : a.slice ? a.slice() : Object.assign({}, a)

export class Assertion extends Error {
  constructor(opts={}) {
    super(opts.message);
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
    this.operator = opts.operator;
    this.expects = opts.expects;
    this.actual = opts.actual;
  }
}
Assertion.prototype.name = 'Assertion'
