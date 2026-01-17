# sub<sub><sup> ✦ </sup></sub>script [![build](https://github.com/dy/subscript/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/subscript/actions/workflows/node.js.yml) [![npm](https://img.shields.io/npm/v/subscript)](http://npmjs.org/subscript) [![demo](https://img.shields.io/badge/demo-%F0%9F%9A%80-white)](https://dy.github.io/subscript/repl) [![ॐ](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://krishnized.github.io/license)

> Safe expression evaluator & language tool.

```js
import subscript from 'subscript'

subscript`a + b * 2`({ a: 1, b: 3 })  // 7
```

* **Minimal** – common expressions < JSON + expressions < JS subset
* **Safe** — sandboxed, no global access
* **Fast** — Pratt parser engine, strong in class
* **Portable** — universal expression format, any compile target
* **Self-hosting** — compiles own source (js in js)
* **Language tool** — modular syntax extensions for custom DSL


## Presets

**subscript** — common expressions
```js
import expr from 'subscript'

expr`a.b + c * 2`({ a: { b: 1 }, c: 3 })  // 7
expr`x > 0 && y != z`({ x: 1, y: 2, z: 3 })  // true
```

**justin** — JSON + expressions (JSON superset)
```js
import justin from 'subscript/justin.js'

justin`{ x: a?.b ?? 0, y: [1, ...rest] }`({ a: null, rest: [2, 3] })
// { x: 0, y: [1, 2, 3] }

justin`items.filter(x => x > 1)`({ items: [1, 2, 3] })  // [2, 3]
```

**jessie** — JSON + expressions + statements (JS subset)
```js
import jessie from 'subscript/jessie.js'

jessie`
  function factorial(n) {
    if (n <= 1) return 1
    return n * factorial(n - 1)
  }
  factorial(5)
`({})  // 120
```

## Extension

```js
import subscript, { binary, operator, compile, token } from 'subscript/justin.js'

// add intersection operator
binary('∩', 80)
operator('∩', (a, b) => (
  a = compile(a), b = compile(b),
  ctx => a(ctx).filter(x => b(ctx).includes(x))
))

subscript`[1,2,3] ∩ [2,3,4]`({})  // [2, 3]

// add units
token('px', 200, n => n && [, n[1] + 'px'])  // 5px → "5px"
```

See [docs.md](./docs.md) for full API.


## Expressions format

Subscript uses simplified syntax tree format:

```js
import { parse } from 'subscript'

parse('a + b * 2')
// ['+', 'a', ['*', 'b', [, 2]]]
```

Three forms:

```js
'x'             // identifier — resolve from context
[, value]       // literal — return as-is
[op, ...args]   // operation — apply operator
```

See [spec.md](./spec.md) for full specification.


## Safety

Blocked by default:
- `__proto__`, `__defineGetter__`, `__defineSetter__`
- `constructor`, `prototype`
- Global access (only context is visible)

```js
subscript`constructor.constructor("alert(1)")()`({})
// undefined (blocked)
```

## Performance

Parse 30k times:
```
subscript: ~150 ms 🥇
justin: ~183 ms
jsep: ~270 ms 🥈
jexpr: ~297 ms 🥉
mr-parser: ~420 ms
expr-eval: ~480 ms
math-parser: ~570 ms
math-expression-evaluator: ~900ms
jexl: ~1056 ms
mathjs: ~1200 ms
new Function: ~1154 ms

// Evaluate 30k times:
new Function  ~7ms   🥇
subscript     ~15ms  🥈
justin: ~17 ms
jsep          ~30ms  🥉
math-expression-evaluator: ~50ms
expr-eval: ~72 ms
jexl: ~110 ms
mathjs: ~119 ms
```


## Utils

**Bundle** — create custom dialect bundle:
```js
import { bundle } from 'subscript/util/bundle.js'

// Bundle specific features into single file
const code = await bundle('subscript/jessie.js')
// → self-contained ES module with parse, compile exports
```

**REPL** — interactive dialect builder with live bundling:
[**Try REPL →**](https://dy.github.io/subscript/repl.html)


## Used by

* [jz](https://github.com/dy/jz) — JS subset → WASM compiler
<!-- * [prepr](https://github.com/dy/prepr) -->
<!-- * [glsl-transpiler](https://github.com/stackgl/glsl-transpiler) -->
<!-- * [piezo](https://github.com/dy/piezo) -->


## See Also

[jsep](https://github.com/EricSmekens/jsep), [jexl](https://github.com/TomFrost/Jexl), [expr-eval](https://github.com/silentmatt/expr-eval), [math.js](https://mathjs.org/).

<!-- [mozjexl](https://github.com/mozilla/mozjexl), [jexpr](https://github.com/justinfagnani/jexpr), [expression-eval](https://github.com/donmccurdy/expression-eval), [string-math](https://github.com/devrafalko/string-math), [nerdamer](https://github.com/jiggzson/nerdamer), [math-codegen](https://github.com/mauriciopoppe/math-codegen), [math-parser](https://www.npmjs.com/package/math-parser), [nx-compile](https://github.com/nx-js/compiler-util), [built-in-math-eval](https://github.com/mauriciopoppe/built-in-math-eval) -->

<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
