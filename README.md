# sub<sub><sup> ✦ </sup></sub>script [![build](https://github.com/dy/subscript/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/subscript/actions/workflows/node.js.yml) [![npm](https://img.shields.io/npm/v/subscript)](http://npmjs.org/subscript) [![size](https://img.shields.io/bundlephobia/minzip/subscript?label=size)](https://bundlephobia.com/package/subscript)

> Tiny expression compiler.

```js
import subscript from 'subscript'

let fn = subscript('a + b * 2')
fn({ a: 1, b: 3 })  // 7
```


* **Minimal** – common expressions < JSON + expressions < JS subset
* **Safe** — sandboxed, blocks `__proto__`, `constructor`, no global access
* **Fast** — Pratt parser engine, see [benchmarks](#performance)
* **Portable** — universal expression format, any compile target
* **Metacircular** — [jessie](#jessie) can parse and compile itself
* **Extensible** — pluggable syntax for building custom DSL


[**Playground →**](https://dy.github.io/subscript/)


## Install

```
npm install subscript
```


## Presets

**subscript** — common expressions (~4kb gzip)
```js
import subscript from 'subscript'

subscript('a.b + c * 2')({ a: { b: 1 }, c: 3 })  // 7
subscript('x > 0 && y != z')({ x: 1, y: 2, z: 3 })  // true
```

**justin** — JSON + expressions (~6kb gzip)
```js
import justin from 'subscript/justin.js'

justin('{ x: a?.b ?? 0, y: [1, ...rest] }')({ a: null, rest: [2, 3] })
// { x: 0, y: [1, 2, 3] }

justin('items.filter(x => x > 1)')({ items: [1, 2, 3] })  // [2, 3]
```

**jessie** — JS subset (~8kb gzip)
```js
import jessie from 'subscript/jessie.js'

let fn = jessie(`
  function factorial(n) {
    if (n <= 1) return 1
    return n * factorial(n - 1)
  }
  factorial(5)
`)
fn({})  // 120
```

Jessie can parse and compile its own source code.

## Extension

Add a set intersection operator:

```js
import { binary, operator, compile } from 'subscript/justin.js'

binary('∩', 80)  // register parser
operator('∩', (a, b) => (  // register compiler
  a = compile(a), b = compile(b),
  ctx => a(ctx).filter(x => b(ctx).includes(x))
))
```

```js
import justin from 'subscript/justin.js'
justin('[1,2,3] ∩ [2,3,4]')({})  // [2, 3]
```

See [docs.md](./docs.md) for full API: `binary`, `unary`, `nary`, `group`, `access`, `literal`, `token`.


## Tree Format

Expressions parse to a minimal JSON-compatible AST:

```js
import { parse } from 'subscript'

parse('a + b * 2')
// ['+', 'a', ['*', 'b', [, 2]]]
```

Three forms:

```js
'x'             // identifier — resolve from context
[, value]       // literal — return as-is (empty slot = data)
[op, ...args]   // operation — apply operator
```

Portable to any language. See [spec.md](./spec.md).


## Safety

Blocked by default:
- `__proto__`, `__defineGetter__`, `__defineSetter__`
- `constructor`, `prototype`
- Global access (only context is visible)

```js
subscript('constructor.constructor("alert(1)")()')({})
// undefined (blocked)
```

## Performance

Parse 30k expressions:

| Parser | Time |
|--------|------|
| subscript | ~150ms |
| justin | ~183ms |
| jsep | ~270ms |
| expr-eval | ~480ms |
| jexl | ~1056ms |

Evaluate 30k times:

| Evaluator | Time |
|-----------|------|
| new Function | ~7ms |
| subscript | ~15ms |
| jsep+eval | ~30ms |
| expr-eval | ~72ms |


## Template Tag

For repeated evaluation, use template syntax for automatic caching:

```js
subscript`a + b`({ a: 1, b: 2 })  // cached compilation

// interpolate values
const limit = 100
subscript`x < ${limit}`({ x: 50 })  // true
```

## Bundle

Create custom dialect as single file:

```js
import { bundle } from 'subscript/util/bundle.js'

const code = await bundle('subscript/jessie.js')
// → self-contained ES module
```

[**Playground →**](https://dy.github.io/subscript/) — interactive dialect builder


## Used by

* [jz](https://github.com/dy/jz) — JS subset → WASM compiler
<!-- * [prepr](https://github.com/dy/prepr) -->
<!-- * [glsl-transpiler](https://github.com/stackgl/glsl-transpiler) -->
<!-- * [piezo](https://github.com/dy/piezo) -->


## See Also

[jsep](https://github.com/EricSmekens/jsep), [jexl](https://github.com/TomFrost/Jexl), [expr-eval](https://github.com/silentmatt/expr-eval), [math.js](https://mathjs.org/).

<!-- [mozjexl](https://github.com/mozilla/mozjexl), [jexpr](https://github.com/justinfagnani/jexpr), [expression-eval](https://github.com/donmccurdy/expression-eval), [string-math](https://github.com/devrafalko/string-math), [nerdamer](https://github.com/jiggzson/nerdamer), [math-codegen](https://github.com/mauriciopoppe/math-codegen), [math-parser](https://www.npmjs.com/package/math-parser), [nx-compile](https://github.com/nx-js/compiler-util), [built-in-math-eval](https://github.com/mauriciopoppe/built-in-math-eval) -->

<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
