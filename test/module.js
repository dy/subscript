/**
 * Test: import/export parsing feature
 *
 * Tests module.js for ES module syntax parsing.
 * Note: Full JS file parsing requires ASI or explicit semicolons.
 */

// Build parser with all features
import '../src/parse.js'
import '../feature/literal.js'
import '../feature/member.js'
import '../feature/group.js'
import '../feature/assign.js'
import '../feature/arithmetic.js'
import '../feature/bit.js'
import '../feature/cmp.js'
import '../feature/shift.js'
import '../feature/pow.js'
import '../feature/bool.js'
import '../feature/collection.js'
import '../feature/ternary.js'
import '../feature/arrow.js'
import '../feature/optional.js'
import '../feature/spread.js'
import '../feature/regex.js'
import '../feature/comment.js'
import '../feature/template.js'
import '../feature/block.js'
import '../feature/if.js'
import '../feature/loop.js'
import '../feature/var.js'
import '../feature/switch.js'
import '../feature/destruct.js'
import '../feature/function.js'
import '../feature/throw.js'
import '../feature/try.js'
import '../feature/module.js'

import parse from '../src/parse.js'

// Test cases for import/export syntax
const tests = {
  // Side-effect import
  "import './x.js'": ['import', './x.js'],

  // Named imports
  "import { a } from './x.js'": ['import', './x.js', ['{}', 'a']],
  "import { a, b } from './x.js'": ['import', './x.js', ['{}', 'a', 'b']],
  "import { a as b } from './x.js'": ['import', './x.js', ['{}', ['as', 'a', 'b']]],

  // Namespace import
  "import * as X from './x.js'": ['import', './x.js', ['*', 'X']],

  // Default import
  "import X from './x.js'": ['import', './x.js', ['default', 'X']],

  // Named exports
  "export { a }": ['export', ['{}', 'a']],
  "export { a, b }": ['export', ['{}', 'a', 'b']],
  "export { a as b }": ['export', ['{}', ['as', 'a', 'b']]],

  // Re-exports
  "export { a } from './x.js'": ['export', ['{}', 'a'], './x.js'],
  "export * from './x.js'": ['export', ['*'], './x.js'],

  // Declaration exports
  "export default 1": ['export', ['default', [, 1]]],
  "export const x = 1": ['export', ['const', 'x', [, 1]]],
  "export let y = 2": ['export', ['let', 'y', [, 2]]],

  // Multiple statements (semicolon-separated)
  "import { a } from './x'; export { a }": [';', ['import', './x', ['{}', 'a']], ['export', ['{}', 'a']]],

  // Comments with code
  "/* comment */ import './x'": ['import', './x'],
  "// comment\n1": [, 1],  // Single-line comment followed by value
}

console.log('=== Import/Export Parsing Tests ===\n')

let passed = 0, failed = 0

for (const [input, expected] of Object.entries(tests)) {
  try {
    const ast = parse(input)
    const match = JSON.stringify(ast) === JSON.stringify(expected)
    if (match) {
      console.log(`✓ ${input.replace(/\n/g, '\\n')}`)
      passed++
    } else {
      console.log(`✗ ${input.replace(/\n/g, '\\n')}`)
      console.log(`  Expected: ${JSON.stringify(expected)}`)
      console.log(`  Got:      ${JSON.stringify(ast)}`)
      failed++
    }
  } catch (e) {
    console.log(`✗ ${input.replace(/\n/g, '\\n')}`)
    console.log(`  Error: ${e.message}`)
    failed++
  }
}

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
