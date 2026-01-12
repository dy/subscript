/**
 * Tests for Jessie gap features: throw, try/catch/finally, for-of, function
 */
import test, { is, throws } from 'tst'
import { parse, compile } from '../subscript.js'

// Import jessie to get all features
import '../jessie.js'

// Import new features
import '../feature/throw.js'
import '../feature/try.js'
import '../feature/function.js'

const run = (code, ctx = {}) => compile(parse(code))(ctx)

// throw
test('throw: parse', () => {
  is(parse('throw x'), ['throw', 'x'])
  is(parse('throw "oops"'), ['throw', [, 'oops']])
  is(parse('throw 42'), ['throw', [, 42]])
  is(parse('throw a + b'), ['throw', ['+', 'a', 'b']])
  is(parse('throw f()'), ['throw', ['()', 'f', null]])
})

test('throw: compile', () => {
  throws(() => run('throw "oops"'), /oops/)
})

test('throw: expression value', () => {
  throws(() => run('throw 42'), e => e === 42)
  throws(() => run('throw x', { x: 'msg' }), /msg/)
  throws(() => run('throw a + b', { a: 'he', b: 'llo' }), /hello/)
})

test('throw: in conditional', () => {
  is(run('if (0) throw "no"'), undefined)
  throws(() => run('if (1) throw "yes"'), /yes/)
})

test('throw: in loop', () => {
  throws(() => run('if (1) { for (let i = 0; i < 5; i++) if (i == 2) throw i }'), e => e === 2)
})

// try/catch/finally
test('try/catch: parse', () => {
  is(parse('try { x } catch (e) { y }'), ['try', 'x', 'e', 'y'])
  is(parse('try { a; b } catch (err) { c }'), ['try', [';', 'a', 'b'], 'err', 'c'])
})

test('try/finally: parse', () => {
  is(parse('try { x } finally { y }'), ['try', 'x', null, null, 'y'])
})

test('try/catch/finally: parse', () => {
  is(parse('try { x } catch (e) { y } finally { z }'), ['try', 'x', 'e', 'y', 'z'])
})

test('try/catch: compile', () => {
  is(run('try { throw "err" } catch (e) { e }'), 'err')
})

test('try/catch: error variable scope', () => {
  // e should be accessible inside catch
  is(run('try { throw "msg" } catch (e) { e + "!" }'), 'msg!')
  // e should not leak outside (test by overwriting outer e)
  is(run('if (1) { let e = "outer"; try { throw "inner" } catch (e) { e }; e }'), 'outer')
})

test('try/catch: no error', () => {
  is(run('try { 42 } catch (e) { 0 }'), 42)
  is(run('if (1) { let x = 0; try { x = 1 } catch (e) { x = 2 }; x }'), 1)
})

test('try/finally: compile', () => {
  const ctx = { x: 42, y: 0 }
  is(run('try { x } finally { y = 1 }', ctx), 42)
  is(ctx.y, 1)
})

test('try/finally: always runs', () => {
  const ctx = { cleanup: 0 }
  try { run('try { throw "err" } finally { cleanup = 1 }', ctx) } catch {}
  is(ctx.cleanup, 1)
})

test('try/finally: return value preserved', () => {
  is(run('try { 42 } finally { 0 }'), 42)
})

test('try/catch/finally: all three', () => {
  const ctx = { log: '' }
  is(run('try { log += "try,"; throw "e" } catch (e) { log += "catch,"; 99 } finally { log += "finally" }', ctx), 99)
  is(ctx.log, 'try,catch,finally')
})

test('try/catch/finally: no error path', () => {
  const ctx = { log: '' }
  is(run('try { log += "try,"; 42 } catch (e) { log += "catch," } finally { log += "finally" }', ctx), 42)
  is(ctx.log, 'try,finally')
})

test('try/catch: rethrow', () => {
  throws(() => run('try { throw "inner" } catch (e) { throw "outer" }'), /outer/)
})

test('try/catch: nested', () => {
  is(run('try { try { throw "a" } catch (e) { throw "b" } } catch (e) { e }'), 'b')
})

test('try/catch: with break in loop', () => {
  // break should not be caught as an exception
  is(run('if (1) { let r = 0; for (let i = 0; i < 5; i++) { try { if (i == 2) break; r = i } catch (e) {} }; r }'), 1)
})

test('try/catch: with continue in loop', () => {
  is(run('if (1) { let r = 0; for (let i = 0; i < 3; i++) { try { if (i == 1) continue; r += i } catch (e) {} }; r }'), 2)
})

// for-of
test('for-of: parse', () => {
  is(parse('for (x of arr) sum += x'), ['for-of', 'x', 'arr', ['+=', 'sum', 'x']])
  is(parse('for (const x of arr) f(x)'), ['for-of', 'x', 'arr', ['()', 'f', 'x'], 'const'])
  is(parse('for (let x of arr) { x }'), ['for-of', 'x', 'arr', ['block', 'x'], 'let'])
})

test('for-of: parse iterable expressions', () => {
  is(parse('for (x of [1,2,3]) x')[2], ['[]', [',', [, 1], [, 2], [, 3]]])
  is(parse('for (x of get()) x')[2], ['()', 'get', null])
  is(parse('for (x of a.b) x')[2], ['.', 'a', 'b'])
})

test('for-of: compile', () => {
  is(run('if (1) { let sum = 0; for (x of arr) sum += x; sum }', { arr: [1, 2, 3] }), 6)
})

test('for-of: with const', () => {
  is(run('if (1) { let r = ""; for (const c of str) r += c; r }', { str: 'abc' }), 'abc')
})

test('for-of: with let', () => {
  is(run('if (1) { let sum = 0; for (let n of arr) sum += n; sum }', { arr: [10, 20] }), 30)
})

test('for-of: empty iterable', () => {
  is(run('if (1) { let count = 0; for (x of arr) count++; count }', { arr: [] }), 0)
})

test('for-of: break', () => {
  is(run('if (1) { let sum = 0; for (x of arr) { if (x > 2) break; sum += x }; sum }', { arr: [1, 2, 3, 4] }), 3)
})

test('for-of: break early', () => {
  is(run('if (1) { let r = ""; for (c of "hello") { if (c == "l") break; r += c }; r }'), 'he')
})

test('for-of: continue', () => {
  is(run('if (1) { let sum = 0; for (x of arr) { if (x == 2) continue; sum += x }; sum }', { arr: [1, 2, 3] }), 4)
})

test('for-of: continue skip odds', () => {
  is(run('if (1) { let r = ""; for (n of arr) { if (n % 2) continue; r += n }; r }', { arr: [1, 2, 3, 4, 5] }), '24')
})

test('for-of: nested for-of', () => {
  is(run(`if (1) { 
    let r = ""; 
    for (a of [1, 2]) 
      for (b of ["a", "b"]) 
        r += a + b + ","; 
    r 
  }`), '1a,1b,2a,2b,')
})

test('for-of: array literal', () => {
  is(run('if (1) { let sum = 0; for (x of [1, 2, 3]) sum += x; sum }'), 6)
})

test('for-of: string iteration', () => {
  is(run('if (1) { let r = ""; for (c of "xyz") r = c + r; r }'), 'zyx')
})

test('for-of: mutation in loop', () => {
  is(run('if (1) { let arr = [1, 2, 3]; let r = []; for (x of arr) r.push(x * 2); r }'), [2, 4, 6])
})

// function
test('function: parse declaration', () => {
  is(parse('function f() { x }'), ['function', 'f', [], 'x'])
  is(parse('function add(a, b) { a + b }'), ['function', 'add', ['a', 'b'], ['+', 'a', 'b']])
  is(parse('function greet(name) { "Hello, " + name }'), ['function', 'greet', ['name'], ['+', [, 'Hello, '], 'name']])
})

test('function: parse expression', () => {
  is(parse('function() { 1 }'), ['function', null, [], [, 1]])
  is(parse('function(x) { x * 2 }'), ['function', null, ['x'], ['*', 'x', [, 2]]])
  is(parse('let f = function(a, b) { a + b }')[2][0], 'function')
})

test('function: declaration compile', () => {
  is(run('if (1) { function double(x) { x * 2 }; double(5) }'), 10)
})

test('function: expression compile', () => {
  is(run('if (1) { let f = function(x) { x + 1 }; f(10) }'), 11)
})

test('function: no params', () => {
  is(run('if (1) { function answer() { 42 }; answer() }'), 42)
})

test('function: multiple params', () => {
  is(run('if (1) { function add3(a, b, c) { a + b + c }; add3(1, 2, 3) }'), 6)
})

test('function: with return', () => {
  is(run('if (1) { function fac(n) { if (n <= 1) return 1; return n * fac(n - 1) }; fac(5) }'), 120)
})

test('function: early return', () => {
  is(run('if (1) { function check(x) { if (x < 0) return "negative"; return "non-negative" }; check(-5) }'), 'negative')
})

test('function: return undefined', () => {
  is(run('if (1) { function noop() { return }; noop() }'), undefined)
})

test('function: implicit return (last expr)', () => {
  is(run('if (1) { function inc(x) { x + 1 }; inc(10) }'), 11)
})

test('function: closure', () => {
  is(run('if (1) { let x = 10; let add = function(y) { x + y }; add(5) }'), 15)
})

test('function: closure captures variable', () => {
  is(run('if (1) { let mult = 3; function scale(x) { x * mult }; scale(4) }'), 12)
})

test('function: nested function', () => {
  is(run('if (1) { function outer(x) { function inner(y) { x + y }; inner(10) }; outer(5) }'), 15)
})

test('function: recursive fibonacci', () => {
  is(run('if (1) { function fib(n) { if (n <= 1) return n; return fib(n - 1) + fib(n - 2) }; fib(10) }'), 55)
})

test('function: passed as value', () => {
  is(run('if (1) { function apply(f, x) { f(x) }; function double(n) { n * 2 }; apply(double, 21) }'), 42)
})

test('function: returned from function', () => {
  is(run('if (1) { function makeAdder(n) { function(x) { x + n } }; let add5 = makeAdder(5); add5(10) }'), 15)
})

test('function: counter closure', () => {
  is(run(`if (1) { 
    let count = 0; 
    function inc() { count = count + 1; count }; 
    inc(); inc(); inc() 
  }`), 3)
})

test('function: mutually recursive even/odd', () => {
  is(run(`if (1) {
    function isEven(n) { if (n == 0) return true; return isOdd(n - 1) };
    function isOdd(n) { if (n == 0) return false; return isEven(n - 1) };
    isEven(10)
  }`), true)
})

test('function: local variables', () => {
  is(run('if (1) { function sq(x) { let r = x * x; r }; sq(5) }'), 25)
})

// traditional for still works
test('for: traditional still works', () => {
  is(run('if (1) { let sum = 0; for (let i = 0; i < 3; i++) sum += i; sum }'), 3)
})

// integration tests: combining features
test('integration: throw in for-of', () => {
  throws(() => run('for (x of [1, 2, 3]) throw x'), e => e === 1)
})

test('integration: try/catch in for-of', () => {
  is(run(`if (1) {
    let errors = 0;
    for (x of [1, 0, 2]) {
      try { if (x == 0) throw "zero" } catch (e) { errors++ }
    };
    errors
  }`), 1)
})

test('integration: for-of in function', () => {
  is(run(`if (1) {
    function sum(arr) {
      let total = 0;
      for (n of arr) total += n;
      total
    };
    sum([1, 2, 3, 4])
  }`), 10)
})

test('integration: function with try/catch', () => {
  is(run(`if (1) {
    function safe(x) {
      try {
        if (x < 0) throw "negative";
        return x * 2
      } catch (e) {
        return 0
      }
    };
    safe(-5) + safe(10)
  }`), 20)
})

test('integration: recursive with exception', () => {
  is(run(`if (1) {
    function countdown(n) {
      if (n <= 0) throw "done";
      countdown(n - 1)
    };
    try { countdown(3) } catch (e) { e }
  }`), 'done')
})
