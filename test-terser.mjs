// Test Terser minification directly with npm package
import { minify } from 'terser'

const testCode = `let idx = 0;
function parse(text) {
  let cur = 0;
  return { idx, cur };
}
console.log(idx, parse, cur)`

try {
  const result = await minify(testCode, {
    compress: { passes: 3, toplevel: true, ecma: 2020, unsafe: true },
    mangle: { toplevel: true },
    format: { ecma: 2020, comments: false, semicolons: false }
  })
  
  console.log('✓ Success!')
  console.log('Original:')
  console.log(testCode)
  console.log('\nOriginal bytes:', testCode.length)
  console.log('\nMinified:')
  console.log(result.code)
  console.log('\nMinified bytes:', result.code.length)
  console.log('Reduction:', Math.round(100 - (result.code.length / testCode.length) * 100) + '%')
} catch (e) {
  console.error('Error:', e.message)
}
