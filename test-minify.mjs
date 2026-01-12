import fs from 'fs'
import { minify } from 'terser'

const constSrc = fs.readFileSync('./src/const.js', 'utf8')
const parseSrc = fs.readFileSync('./src/parse.js', 'utf8')
const compileSrc = fs.readFileSync('./src/compile.js', 'utf8')

const stripImports = code => code.replace(/^import\s+.*$/gm, '')
const stripExports = code => code
  .replace(/^export\s+default\s+/gm, '')
  .replace(/^export\s+(const|let|function)\s+/gm, '$1 ')
  .replace(/^export\s+\{[^}]+\}.*$/gm, '')

let bundle = `// Bundled subscript
// https://github.com/phtml/subscript

`
bundle += stripExports(constSrc) + '\n'
bundle += stripImports(parseSrc).replace(/^export\s+let\s+/gm, 'let ').replace(/^export\s+default\s+parse\s*;?\s*$/gm, '') + '\n'
bundle += stripImports(compileSrc).replace(/^export\s+const\s+/gm, 'const ').replace(/^export\s+default\s+compile\s*;?\s*$/gm, '') + '\n'
bundle += `export { parse, compile }
export default (code) => compile(parse(code))
`

console.log('Original:', bundle.length, 'bytes')

try {
  const result = await minify(bundle, {
    module: true,
    compress: { passes: 3, ecma: 2020, unsafe: true },
    mangle: { toplevel: false },
    format: { ecma: 2020, comments: false, semicolons: false }
  })

  if (result.error) {
    console.log('❌ Terser error:', result.error)
  } else {
    console.log('Minified:', result.code.length, 'bytes')
    console.log('Reduction:', Math.round(100 - result.code.length/bundle.length*100) + '%')
    console.log('\n=== Last 200 chars (should have exports) ===')
    console.log(result.code.slice(-200))
    console.log('\n✓ Minification successful!')
  }
} catch (e) {
  console.log('❌ Terser exception:', e.message)
}
