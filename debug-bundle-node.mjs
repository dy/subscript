import fs from 'fs'

// Get source files
const constSrc = fs.readFileSync('./src/const.js', 'utf8')
const parseSrc = fs.readFileSync('./src/parse.js', 'utf8')
const compileSrc = fs.readFileSync('./src/compile.js', 'utf8')

// Replicate the bundle generation from repl.html
const stripImports = code => code.replace(/^import\s+.*$/gm, '')
const stripExports = code => code
  .replace(/^export\s+default\s+/gm, '')
  .replace(/^export\s+(const|let|function)\s+/gm, '$1 ')
  .replace(/^export\s+\{[^}]+\}.*$/gm, '')

let bundle = `// Bundled subscript
// https://github.com/phtml/subscript

(function() {
'use strict';

`

// 1. Constants
bundle += `// === src/const.js ===\n`
bundle += stripExports(constSrc) + '\n\n'

// 2. Parse
bundle += `// === src/parse.js ===\n`
let parseModule = stripImports(parseSrc)
  .replace(/^export\s+let\s+/gm, 'let ')
  .replace(/^export\s+default\s+parse\s*;?\s*$/gm, '')
bundle += parseModule + '\n\n'

// 3. Compile
bundle += `// === src/compile.js ===\n`
let compileModule = stripImports(compileSrc)
  .replace(/^export\s+const\s+/gm, 'const ')
  .replace(/^export\s+default\s+compile\s*;?\s*$/gm, '')
bundle += compileModule + '\n\n'

// Close IIFE
bundle += `window.parse = parse;
window.compile = compile;
})();
`

console.log('Bundle size:', bundle.length, 'bytes')

// Test if it's valid JavaScript
try {
  new Function(bundle)
  console.log('✓ Bundle is syntactically valid!')
} catch (e) {
  console.log('❌ Bundle has syntax error:', e.message)
  // Find the line with error
  const lines = bundle.split('\n')
  const match = e.message.match(/position (\d+)/)
  if (match) {
    let pos = parseInt(match[1])
    let lineNum = 0
    for (let i = 0; i < lines.length; i++) {
      if (pos <= lines[i].length) {
        console.log(`Error around line ${i}: ${lines[i].slice(0, 100)}`)
        break
      }
      pos -= lines[i].length + 1
    }
  }
}

// Show compile.js section
console.log('\n=== COMPILE.JS SECTION (first 30 lines) ===')
const compileStart = bundle.indexOf('// === src/compile.js ===')
const compileEnd = bundle.indexOf('window.parse')
const compileSection = bundle.slice(compileStart, compileEnd).split('\n').slice(0, 35)
compileSection.forEach((line, i) => console.log(`${i}: ${line.slice(0, 120)}`))
