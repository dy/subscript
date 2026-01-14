/**
 * Test bundler by bundling feature files and verifying runtime works
 */
import { bundleFile } from '../util/bundle.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { writeFile, unlink } from 'fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Test helper
const tests = []
let passed = 0, failed = 0

function test(name, fn) {
  tests.push({ name, fn })
}

async function runTests() {
  console.log('=== Bundler Runtime Tests ===\n')
  for (const { name, fn } of tests) {
    try {
      await fn()
      console.log(`✓ ${name}`)
      passed++
    } catch (e) {
      console.log(`✗ ${name}`)
      console.log(`  Error: ${e.message}`)
      if (process.env.DEBUG) console.log(e.stack)
      failed++
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

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

// Test core modules bundle and export correctly
test('bundle parse/pratt.js - exports functions', async () => {
  await bundleAndRun('parse/pratt.js', async (mod) => {
    if (typeof mod.default !== 'function') throw new Error('default export not a function')
    if (typeof mod.token !== 'function') throw new Error('token not exported')
    if (typeof mod.binary !== 'function') throw new Error('binary not exported')
    if (typeof mod.expr !== 'function') throw new Error('expr not exported')
  })
})

test('bundle compile/js.js - exports functions', async () => {
  await bundleAndRun('compile/js.js', async (mod) => {
    if (typeof mod.default !== 'function') throw new Error('default export not a function')
    if (typeof mod.operator !== 'function') throw new Error('operator not exported')
    if (typeof mod.compile !== 'function') throw new Error('compile not exported')
  })
})

// Test feature files produce valid JS (no syntax/runtime errors on import)
// Universal features
test('bundle feature/number.js - valid JS', () => bundleAndVerifySyntax('feature/number.js'))
test('bundle feature/string.js - valid JS', () => bundleAndVerifySyntax('feature/string.js'))
test('bundle feature/op.js - valid JS', () => bundleAndVerifySyntax('feature/op.js'))
test('bundle feature/member.js - valid JS', () => bundleAndVerifySyntax('feature/member.js'))
test('bundle feature/group.js - valid JS', () => bundleAndVerifySyntax('feature/group.js'))
test('bundle feature/collection.js - valid JS', () => bundleAndVerifySyntax('feature/collection.js'))
test('bundle feature/pow.js - valid JS', () => bundleAndVerifySyntax('feature/pow.js'))

// C-family features
test('bundle feature/c/number.js - valid JS', () => bundleAndVerifySyntax('feature/c/number.js'))
test('bundle feature/c/string.js - valid JS', () => bundleAndVerifySyntax('feature/c/string.js'))
test('bundle feature/c/op.js - valid JS', () => bundleAndVerifySyntax('feature/c/op.js'))
test('bundle feature/c/comment.js - valid JS', () => bundleAndVerifySyntax('feature/c/comment.js'))
test('bundle feature/block.js - valid JS', () => bundleAndVerifySyntax('feature/block.js'))
test('bundle feature/c/if.js - valid JS', () => bundleAndVerifySyntax('feature/c/if.js'))
test('bundle feature/c/loop.js - valid JS', () => bundleAndVerifySyntax('feature/c/loop.js'))
test('bundle feature/c/try.js - valid JS', () => bundleAndVerifySyntax('feature/c/try.js'))
test('bundle feature/c/switch.js - valid JS', () => bundleAndVerifySyntax('feature/c/switch.js'))

// JS-specific features
test('bundle feature/js/arrow.js - valid JS', () => bundleAndVerifySyntax('feature/js/arrow.js'))
test('bundle feature/js/optional.js - valid JS', () => bundleAndVerifySyntax('feature/js/optional.js'))
test('bundle feature/js/spread.js - valid JS', () => bundleAndVerifySyntax('feature/js/spread.js'))
test('bundle feature/js/template.js - valid JS', () => bundleAndVerifySyntax('feature/js/template.js'))
test('bundle feature/regex.js - valid JS', () => bundleAndVerifySyntax('feature/regex.js'))

// Run all tests
runTests()
