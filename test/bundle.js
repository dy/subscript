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
test('bundle src/parse.js - exports functions', async () => {
  await bundleAndRun('src/parse.js', async (mod) => {
    if (typeof mod.default !== 'function') throw new Error('default export not a function')
    if (typeof mod.token !== 'function') throw new Error('token not exported')
    if (typeof mod.binary !== 'function') throw new Error('binary not exported')
    if (typeof mod.expr !== 'function') throw new Error('expr not exported')
  })
})

test('bundle src/compile.js - exports functions', async () => {
  await bundleAndRun('src/compile.js', async (mod) => {
    if (typeof mod.default !== 'function') throw new Error('default export not a function')
    if (typeof mod.operator !== 'function') throw new Error('operator not exported')
    if (typeof mod.compile !== 'function') throw new Error('compile not exported')
  })
})

// Test feature files produce valid JS (no syntax/runtime errors on import)
test('bundle feature/literal.js - valid JS', () => bundleAndVerifySyntax('feature/literal.js'))
test('bundle feature/bool.js - valid JS', () => bundleAndVerifySyntax('feature/bool.js'))
test('bundle feature/arithmetic.js - valid JS', () => bundleAndVerifySyntax('feature/arithmetic.js'))
test('bundle feature/member.js - valid JS', () => bundleAndVerifySyntax('feature/member.js'))
test('bundle feature/group.js - valid JS', () => bundleAndVerifySyntax('feature/group.js'))
test('bundle feature/cmp.js - valid JS', () => bundleAndVerifySyntax('feature/cmp.js'))
test('bundle feature/ternary.js - valid JS', () => bundleAndVerifySyntax('feature/ternary.js'))
test('bundle feature/collection.js - valid JS', () => bundleAndVerifySyntax('feature/collection.js'))
test('bundle feature/arrow.js - valid JS', () => bundleAndVerifySyntax('feature/js/arrow.js'))
test('bundle feature/optional.js - valid JS', () => bundleAndVerifySyntax('feature/js/optional.js'))
test('bundle feature/spread.js - valid JS', () => bundleAndVerifySyntax('feature/js/spread.js'))
test('bundle feature/regex.js - valid JS', () => bundleAndVerifySyntax('feature/regex.js'))
test('bundle feature/template.js - valid JS', () => bundleAndVerifySyntax('feature/js/template.js'))
test('bundle feature/comment.js - valid JS', () => bundleAndVerifySyntax('feature/comment.js'))
test('bundle feature/bit.js - valid JS', () => bundleAndVerifySyntax('feature/bit.js'))
test('bundle feature/shift.js - valid JS', () => bundleAndVerifySyntax('feature/shift.js'))
test('bundle feature/pow.js - valid JS', () => bundleAndVerifySyntax('feature/pow.js'))
test('bundle feature/assign.js - valid JS', () => bundleAndVerifySyntax('feature/assign.js'))

// Run all tests
runTests()
