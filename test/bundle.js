/**
 * Test bundler by bundling feature files and verifying runtime works
 * Node.js only - uses fs for file operations
 */
import test, { is, ok } from 'tst'
import { bundleFile } from '../util/bundle.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { writeFile, unlink, stat } from 'fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Bundle, write temp file, import, verify
async function bundleAndRun(entry, verify) {
  const code = await bundleFile(join(root, entry))
  const tmp = join(root, `test/.tmp-bundle-${Date.now()}.js`)
  try {
    await writeFile(tmp, code)
    const mod = await import(tmp)
    await verify(mod, code)
  } finally {
    await unlink(tmp).catch(() => {})
  }
}

// Verify code runs without syntax errors
async function bundleAndVerifySyntax(entry) {
  const code = await bundleFile(join(root, entry))
  const tmp = join(root, `test/.tmp-bundle-${Date.now()}.js`)
  try {
    await writeFile(tmp, code)
    await import(tmp)
  } finally {
    await unlink(tmp).catch(() => {})
  }
}

// === Tests ===

test('bundle: subscript.min.js < 14kb', async () => {
  const { size } = await stat(join(root, 'subscript.min.js'))
  ok(size < 14000, `subscript.min.js (${size} bytes) should be < 14000 bytes`)
})

test('bundle: parse.js exports', async () => {
  await bundleAndRun('parse.js', async (mod) => {
    is(typeof mod.default, 'function')
    is(typeof mod.token, 'function')
    is(typeof mod.binary, 'function')
    is(typeof mod.compile, 'function')
    is(typeof mod.operator, 'function')
  })
})

test('bundle: util/stringify.js exports', async () => {
  await bundleAndRun('util/stringify.js', async (mod) => {
    is(typeof mod.codegen, 'function')
    is(typeof mod.generator, 'function')
    is(typeof mod.generators, 'object')
  })
})

test('bundle: feature/number.js', () => bundleAndVerifySyntax('feature/number.js'))
test('bundle: feature/string.js', () => bundleAndVerifySyntax('feature/string.js'))
test('bundle: feature/literal.js', () => bundleAndVerifySyntax('feature/literal.js'))
test('bundle: feature/access.js', () => bundleAndVerifySyntax('feature/access.js'))
test('bundle: feature/group.js', () => bundleAndVerifySyntax('feature/group.js'))
test('bundle: feature/collection.js', () => bundleAndVerifySyntax('feature/collection.js'))
test('bundle: feature/comment.js', () => bundleAndVerifySyntax('feature/comment.js'))
test('bundle: feature/block.js', () => bundleAndVerifySyntax('feature/block.js'))
test('bundle: feature/if.js', () => bundleAndVerifySyntax('feature/if.js'))
test('bundle: feature/loop.js', () => bundleAndVerifySyntax('feature/loop.js'))
test('bundle: feature/try.js', () => bundleAndVerifySyntax('feature/try.js'))
test('bundle: feature/switch.js', () => bundleAndVerifySyntax('feature/switch.js'))
test('bundle: feature/function.js', () => bundleAndVerifySyntax('feature/function.js'))
test('bundle: feature/var.js', () => bundleAndVerifySyntax('feature/var.js'))
test('bundle: feature/destruct.js', () => bundleAndVerifySyntax('feature/destruct.js'))
test('bundle: feature/module.js', () => bundleAndVerifySyntax('feature/module.js'))
test('bundle: feature/accessor.js', () => bundleAndVerifySyntax('feature/accessor.js'))
test('bundle: feature/template.js', () => bundleAndVerifySyntax('feature/template.js'))
test('bundle: feature/regex.js', () => bundleAndVerifySyntax('feature/regex.js'))

// === Dogfooding: Bundle subscript.js and verify parse + compile + eval ===

test('dogfood: subscript.js exports', async () => {
  await bundleAndRun('subscript.js', async (mod) => {
    is(typeof mod.default, 'function')
    is(typeof mod.parse, 'function')
    is(typeof mod.compile, 'function')
  })
})

test('dogfood: parse (expr)', async () => {
  await bundleAndRun('subscript.js', async ({ parse }) => {
    is(parse('1 + 2')[0], '+')
    is(parse('a.b')[0], '.')
    is(parse('f(x)')[0], '()')
  })
})

test('dogfood: parse (jessie)', async () => {
  await bundleAndRun('subscript.js', async (mod) => {
    const { parse: jessieParse } = await import('../jessie.js')
    mod.default.parse = jessieParse
    const { parse } = mod
    is(jessieParse('x => x * 2')[0], '=>')
    is(jessieParse('{a: 1, b: 2}')[0], '{}')
    is(jessieParse('[1, 2, 3]')[0], '[]')
    is(jessieParse('let x = 1')[0], 'let')
  })
})

test('dogfood: compile arithmetic', async () => {
  await bundleAndRun('subscript.js', async ({ parse, compile }) => {
    is(compile(parse('1 + 2'))(), 3)
    is(compile(parse('10 - 3'))(), 7)
    is(compile(parse('4 * 5'))(), 20)
    is(compile(parse('15 / 3'))(), 5)
    is(compile(parse('7 % 4'))(), 3)
    is(compile(parse('1 + 2 * 3'))(), 7)
    is(compile(parse('(1 + 2) * 3'))(), 9)
  })
})

test('dogfood: compile context', async () => {
  await bundleAndRun('subscript.js', async ({ parse, compile }) => {
    is(compile(parse('x + y'))({ x: 100, y: 50 }), 150)
    is(compile(parse('fn(x)'))({ fn: v => v * 2, x: 21 }), 42)
    is(compile(parse('obj.a + obj.b'))({ obj: { a: 10, b: 20 } }), 30)
  })
})

test('dogfood: compile logical', async () => {
  await bundleAndRun('subscript.js', async ({ parse, compile }) => {
    is(compile(parse('!0'))(), true)
    is(compile(parse('!1'))(), false)
  })
})

test('dogfood: compile literals', async () => {
  await bundleAndRun('subscript.js', async ({ parse, compile }) => {
    is(compile(parse('123'))(), 123)
    is(compile(parse('"hello"'))(), 'hello')
    is(compile(parse('1.5'))(), 1.5)
  })
})

test('dogfood: subscript()', async () => {
  await bundleAndRun('subscript.js', async (mod) => {
    const subscript = mod.default
    is(subscript('1 + 2')(), 3)
    is(subscript('x * 2')({ x: 21 }), 42)
  })
})
