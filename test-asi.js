import './jessie.js'
import { parse } from './parse.js'

function test(name, code) {
  try {
    const r = parse(code)
    console.log(`${name}:`, JSON.stringify(r))
  } catch(e) {
    console.log(`${name} ERROR:`, e.message)
  }
}

test('Case 1 (}\\n[)', 'if (x) { y }\n[a]')
test('Case 2 (x\\n!y)', 'x\n!y')
test('Case 3 (let x=1\\n!y)', 'let x = 1\n!y')
test('Case 4 (foo()\\n!bar)', 'foo()\n!bar')
test('Case 5 (foo()\\nlet y=!x)', 'let x = foo()\nlet y = !x')
test('Case 6 (}\\n[1,2])', 'let x = () => { return 1 }\nlet a = [1,2]')
test('Case 7 (let\\nlet)', 'let x = 1\nlet y = 2')
