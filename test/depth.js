// Parse time by nesting depth. A rule that reads a span and then declines leaves
// the next rule to read the same span again, and inside its own nesting that
// doubles the work per level. Each form below reads in time linear in its depth:
// depth 200 well under 20 ms, and depths 1 to 12 give the trees the grammar names.
import test, { is } from 'tst'
import { parse } from '../jessie.js'

const nest = (d, leaf, wrap) => d ? wrap(nest(d - 1, leaf, wrap)) : leaf
const rep = (s, d) => s.repeat(d)

// name: [source at depth d, tree at depth d]
const forms = {
  'call g(g(x))': [d => rep('g(', d) + 'x' + rep(')', d), d => nest(d, 'x', t => ['()', 'g', t])],
  'call g(g(x), 1)': [d => rep('g(', d) + 'x' + rep(', 1)', d), d => nest(d, 'x', t => ['()', 'g', [',', t, [, 1]]])],
  'index call a[0](a[0](x))': [d => rep('a[0](', d) + 'x' + rep(')', d), d => nest(d, 'x', t => ['()', ['[]', 'a', [, 0]], t])],
  'string call "s"("s"(x))': [d => rep('"s"(', d) + 'x' + rep(')', d), d => nest(d, 'x', t => ['()', [, 's'], t])],
  'arrow argument g(x => g(x))': [d => rep('g(x => g(', d) + 'x' + rep('))', d), d => nest(d, 'x', t => ['()', 'g', ['=>', 'x', ['()', 'g', t]]])],
  'method default ({ m(a = g(..)) {} })': [d => rep('({ m(a = g(', d) + '1' + rep(')) {} })', d),
    d => nest(d, [, 1], t => ['()', ['{}', [':', 'm', ['function', null, ['=', 'a', ['()', 'g', t]], null]]]])],
  // `async` as a name: its call, its index, a method named async
  'async(async(x))': [d => rep('async(', d) + 'x' + rep(')', d), d => nest(d, 'x', t => ['()', 'async', t])],
  'async[async[x]]': [d => rep('async[', d) + 'x' + rep(']', d), d => nest(d, 'x', t => ['[]', 'async', t])],
  'async`${async`${x}`}`': [d => rep('async`${', d) + 'x' + rep('}`', d), d => nest(d, 'x', t => ['``', 'async', [, ''], t, [, '']])],
  'method named async ({ async(a = ..) {} })': [d => rep('({ async(a = ', d) + '1' + rep(') {} })', d),
    d => nest(d, [, 1], t => ['()', ['{}', [':', 'async', ['function', null, ['=', 'a', t], null]]]])],
  'async arrow argument g(async (x) => ..)': [d => rep('g(async (x) => ', d) + 'x' + rep(')', d),
    d => nest(d, 'x', t => ['()', 'g', ['async', ['=>', ['()', 'x'], t]]])],
  'async computed member ({ async [g(..)]() {} })': [d => rep('({ async [g(', d) + 'k' + rep(')]() {} })', d),
    d => nest(d, 'k', t => ['()', ['{}', [':', ['[]', ['()', 'g', t]], ['async', ['function', null, null, null]]]]])],
}

for (const [name, [src, tree]] of Object.entries(forms)) test(`depth: ${name}, depths 1 to 12`, () => {
  for (let d = 1; d <= 12; d++) is(parse(src(d)), tree(d))
})

// A worker each: an exponential form never ends, and the timeout fails it.
const url = new URL('../jessie.js', import.meta.url).href
for (const [name, [src]] of Object.entries(forms))
  test.fork(`depth: ${name}, depth 200 under 20 ms`, { timeout: 3000, data: { url, src: src(200) } }, async ({ ok }, { url, src }) => {
    const { parse } = await import(url)
    let best = Infinity
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now()
      parse(src)
      best = Math.min(best, performance.now() - t0)
    }
    ok(best < 20, `${best.toFixed(2)} ms`)
  })
