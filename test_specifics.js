import './jessie.js'
import { parse } from './parse.js'

function test(name, code, expected) {
  try {
    const r = parse(code)
    const json = JSON.stringify(r)
    const exp = JSON.stringify(expected)
    const pass = exp === json
    console.log(pass ? 'PASS' : 'FAIL', name)
    if (!pass) {
        console.log('  got:', json)
        console.log('  exp:', exp)
    }
  } catch(e) {
    console.log('ERROR', name, e.message)
  }
}

test('if{}\\n[a]', 'if (x) { y }\n[a]', [';', ['if', 'x', 'y'], ['[]', 'a']])
test('if{}\\n(z)', 'if (x) { y }\n(z)', [';', ['if', 'x', 'y'], 'z'])
test('a\\n[b]', 'a\n[b]', [';', 'a', ['[]', 'b']])
test('a\\n(b)', 'a\n(b)', [';', 'a', 'b'])
test('fn{}\\nlet', 'let f = () => { return 1 }\nlet a = [1, 2]', [';', ['let', ['=', 'f', ['=>', ['()', null], ['{}', ['return', [null, 1]]]]]], ['let', ['=', 'a', ['[]', [',', [null, 1], [null, 2]]]]]])
test('a[b]', 'a[b]', ['[]', 'a', 'b'])
test('f(x)', 'f(x)', ['()', 'f', 'x'])
test('a.b[c]', 'a.b[c]', ['[]', ['.', 'a', 'b'], 'c'])
test('f()(x)', 'f()(x)', ['()', ['()', 'f', null], 'x'])
test('a\\n.b', 'a\n.b', ['.', 'a', 'b'])
test('x\\n+y', 'x\n+ y', ['+', 'x', 'y'])
test('x\\n-y', 'x\n- y', ['-', 'x', 'y'])
test('x\\n!y', 'x\n!y', [';', 'x', ['!', 'y']])
test('x!=y', 'x != y', ['!=', 'x', 'y'])
test('!x', '!x', ['!', 'x'])
test('let\\nlet', 'let x = 1\nlet y = 2', [';', ['let', ['=', 'x', [null, 1]]], ['let', ['=', 'y', [null, 2]]]])
test('if (x) [a]', 'if (x) [a]', ['if', 'x', ['[]', 'a']])
test('for [a,b] of arr', 'for (let [a, b] of arr) { }', ['for', ['of', ['let', ['[]', [',', 'a', 'b']]], 'arr'], null])
