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
  // `get` and `set` as names: an index, the call of an index; an accessor's computed key
  'get[get[x]]': [d => rep('get[', d) + 'x' + rep(']', d), d => nest(d, 'x', t => ['[]', 'get', t])],
  'set [set [x]]': [d => rep('set [', d) + 'x' + rep(']', d), d => nest(d, 'x', t => ['[]', 'set', t])],
  'get[k](get[k](x))': [d => rep('get[k](', d) + 'x' + rep(')', d), d => nest(d, 'x', t => ['()', ['[]', 'get', 'k'], t])],
  'new get[k](new get[k](x))': [d => rep('new get[k](', d) + 'x' + rep(')', d), d => nest(d, 'x', t => ['new', ['()', ['[]', 'get', 'k'], t]])],
  'x = get[k]⏎(x = get[k]⏎(y))': [d => rep('x = get[k]\n(', d) + 'y' + rep(')', d),
    d => nest(d, 'y', t => ['()', ['=', 'x', ['[]', 'get', 'k']], t])],
  'getter computed key ({ get [g(..)]() {} })': [d => rep('({ get [g(', d) + 'k' + rep(')]() {} })', d),
    d => nest(d, 'k', t => ['()', ['{}', ['get', ['[]', ['()', 'g', t]], undefined, undefined]]])],
  // `get key(…)` with no body after it: the name, an operator, a group
  'set in (set in (x))': [d => rep('set in (', d) + 'x' + rep(')', d), d => nest(d, 'x', t => ['in', 'set', ['()', t]])],
  'get instanceof (get instanceof (X))': [d => rep('get instanceof (', d) + 'X' + rep(')', d),
    d => nest(d, 'X', t => ['instanceof', 'get', ['()', t]])],
  'x + get in (x + get in (o))': [d => rep('x + get in (', d) + 'o' + rep(')', d),
    d => nest(d, 'o', t => ['in', ['+', 'x', 'get'], ['()', t]])],
  'setter default ({ set in(v = ..) {} })': [d => rep('({ set in(v = ', d) + '1' + rep(') {} })', d),
    d => nest(d, [, 1], t => ['()', ['{}', ['set', 'in', ['=', 'v', t], undefined]]])],
  // `*` across a line break: a product, or after a member a generator method
  'product y⏎*g(y⏎*g(x))': [d => rep('y\n*g(', d) + 'x' + rep(')', d), d => nest(d, 'x', t => ['*', 'y', ['()', 'g', t]])],
  // `async *g(…)` is `async` times a call: the generator rule reads `g(…)` and declines
  'product async *g(async *g(x))': [d => rep('async *g(', d) + 'x' + rep(')', d), d => nest(d, 'x', t => ['*', 'async', ['()', 'g', t]])],
  'generator after a member, default param': [d => rep('class A { m() {}\n*g(a = ', d) + '1' + rep(') {} }', d),
    d => nest(d, [, 1], t => ['class', 'A', null, [';', [':', 'm', ['function', null, null, null]], [':', 'g', ['function*', null, ['=', 'a', t], null]]]])],
  'generator named function after a member': [d => rep('class A { m() {}\n*function(a = ', d) + '1' + rep(') {} }', d),
    d => nest(d, [, 1], t => ['class', 'A', null, [';', [':', 'm', ['function', null, null, null]], [':', 'function', ['function*', null, ['=', 'a', t], null]]]])],
  'product y⏎*typeof(y⏎*typeof(x))': [d => rep('y\n*typeof(', d) + 'x' + rep(')', d), d => nest(d, 'x', t => ['*', 'y', ['typeof', ['()', t]]])],
}

// Input JS rejects, held to the time only: the tree the parser gives it is no promise.
const invalid = {
  'a⏎get x(a⏎get x(1)) with no body': [d => rep('a\nget x(', d) + '1' + rep(')', d)],
  'a;⏎*g(a;⏎*g(x)) with no body': [d => rep('a;\n*g(', d) + 'x' + rep(')', d)],
}

for (const [name, [src, tree]] of Object.entries(forms)) test(`depth: ${name}, depths 1 to 12`, () => {
  for (let d = 1; d <= 12; d++) is(parse(src(d)), tree(d))
})

// A worker each: an exponential form never ends, and the timeout fails it.
const url = new URL('../jessie.js', import.meta.url).href
for (const [name, [src]] of Object.entries({ ...forms, ...invalid }))
  test.fork(`depth: ${name}, depth 200 under 20 ms`, { timeout: 3000, data: { url, src: src(200) } }, async ({ ok }, { url, src }) => {
    const { parse } = await import(url)
    let best = Infinity
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now()
      try { parse(src) } catch {}
      best = Math.min(best, performance.now() - t0)
    }
    ok(best < 20, `${best.toFixed(2)} ms`)
  })
