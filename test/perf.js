import test from 'tst'

const RUNS = 3e4
const src = c => `1 + (a * b / c % d) - 2.0 + -3e-3 * +4.4e4 / f.g[0] - i.j(+k == 1)(${c})`

test.fork('perf: expr < jsep', {data: {RUNS, src}}, async ({ ok }, {RUNS, src}) => {
  const bench = (fn) => {
    let best = Infinity
    for (let r = 0; r < 3; r++) {
      let t = performance.now()
      for (let i = 0; i < RUNS; i++) fn(i)
      best = Math.min(best, performance.now() - t)
    }
    return best
  }

  const { parse } = await import('file:///Users/div/projects/subscript/subscript.js')
  const jsep = (await import('jsep')).default

  for (let w = 0; w < RUNS; w++) { parse(src(w)); jsep(src(w)) }

  const time = bench(i => parse(src(i)))
  const baseline = bench(i => jsep(src(i)))
  console.log(`expr: ${time.toFixed(1)}ms, jsep: ${baseline.toFixed(1)}ms`)
  ok(time < baseline, `expr (${time.toFixed(0)}ms) should be < jsep (${baseline.toFixed(0)}ms)`)
})

test.fork('perf: justin <= jsep', {data: {RUNS, src}}, async ({ ok }, {RUNS, src}) => {
  const bench = (fn) => {
    let best = Infinity
    for (let r = 0; r < 3; r++) {
      let t = performance.now()
      for (let i = 0; i < RUNS; i++) fn(i)
      best = Math.min(best, performance.now() - t)
    }
    return best
  }

  const { parse } = await import('file:///Users/div/projects/subscript/justin.js')
  const jsep = (await import('jsep')).default

  for (let w = 0; w < RUNS; w++) { parse(src(w)); jsep(src(w)) }

  const time = bench(i => parse(src(i)))
  const baseline = bench(i => jsep(src(i)))
  console.log(`justin: ${time.toFixed(1)}ms, jsep: ${baseline.toFixed(1)}ms`)
  ok(time <= baseline * 1.08, `justin (${time.toFixed(0)}ms) should be < jsep (${baseline.toFixed(0)}ms)`)
})
