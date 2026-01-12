// Test control flow features
import { parse, compile } from '../subscript.js'
import '../feature/control.js'

const test = (name, fn) => {
  try {
    fn()
    console.log(`✓ ${name}`)
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`)
    console.log(e.stack)
  }
}

const eq = (a, b) => {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw Error(`Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)
}

const run = (code, ctx = {}) => compile(parse(code))(ctx)

// if tests
test('if parse', () => {
  eq(parse('if (a) b'), ['if', 'a', 'b'])
})

test('if/else parse', () => {
  eq(parse('if (a) b else c'), ['if', 'a', 'b', 'c'])
})

test('if eval true', () => {
  eq(run('if (x) 1', { x: true }), 1)
})

test('if eval false', () => {
  eq(run('if (x) 1', { x: false }), undefined)
})

test('if/else eval', () => {
  eq(run('if (x) 1 else 2', { x: true }), 1)
  eq(run('if (x) 1 else 2', { x: false }), 2)
})

// while tests
test('while parse', () => {
  eq(parse('while (a) b'), ['while', 'a', 'b'])
})

test('while eval', () => {
  const ctx = { i: 0, sum: 0 }
  run('while (i < 3) (sum += i, i += 1)', ctx)
  eq(ctx.sum, 3) // 0 + 1 + 2
  eq(ctx.i, 3)
})

// for tests
test('for parse', () => {
  eq(parse('for (i = 0; i < 3; i += 1) x'), ['for', ['=', 'i', [, 0]], ['<', 'i', [, 3]], ['+=', 'i', [, 1]], 'x'])
})

test('for eval', () => {
  const ctx = { sum: 0 }
  run('for (i = 0; i < 5; i += 1) sum += i', ctx)
  eq(ctx.sum, 10) // 0+1+2+3+4
})

test('for empty parts', () => {
  eq(parse('for (;;) x'), ['for', null, null, null, 'x'])
})

// break tests
test('break parse', () => {
  eq(parse('break'), ['break'])
})

test('break in while', () => {
  const ctx = { i: 0 }
  // Note: need explicit grouping - (if...) then (i += 1)
  run('while (i < 10) ((if (i == 3) break), i += 1)', ctx)
  eq(ctx.i, 3)
})

test('break in for', () => {
  const ctx = { last: 0 }
  run('for (i = 0; i < 10; i += 1) (if (i == 5) break else (last = i))', ctx)
  eq(ctx.last, 4)
})

// continue tests
test('continue parse', () => {
  eq(parse('continue'), ['continue'])
})

test('continue in while', () => {
  const ctx = { i: 0, sum: 0 }
  // increment first, then check, then add
  run('while (i < 5) (i += 1, (if (i == 3) continue), sum += i)', ctx)
  eq(ctx.sum, 12) // 1+2+4+5 (skip 3)
})

// return tests
test('return parse', () => {
  eq(parse('return 42'), ['return', [, 42]])
})

test('return no value parse', () => {
  eq(parse('return'), ['return'])
})

console.log('\nDone!')
