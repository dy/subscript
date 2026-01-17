# sub<sub><sup> ✦ </sup></sub>script [![build](https://github.com/dy/subscript/actions/workflows/node.js.yml/badge.svg)](https://github.com/dy/subscript/actions/workflows/node.js.yml) [![npm](https://img.shields.io/npm/v/subscript)](http://npmjs.org/subscript) [![size](https://img.shields.io/bundlephobia/minzip/subscript?label=size)](https://bundlephobia.com/package/subscript) [![demo](https://img.shields.io/badge/play-%F0%9F%9A%80-white)](https://dy.github.io/subscript/) [![microjs](https://img.shields.io/badge/microjs-subscript-blue?color=darkslateblue)](http://microjs.com/#subscript)

> Tiny expression parser & evaluator.

* **Safe** — sandboxed, blocks `__proto__`, `constructor`, no global access
* **Fast** — Pratt parser engine, see [benchmarks](#performance)
* **Portable** — universal expression format, any compile target
* **Metacircular** — can parse and compile itself
* **Extensible** — pluggable syntax for building custom DSL

## Usage

```js
import subscript from 'subscript'

let fn = subscript('a + b * 2')
fn({ a: 1, b: 3 })  // 7
```

## Presets

**subscript** — common expressions:<br>
`a.b a[b] a(b) + - * / % < > <= >= == != ! && || ~ & | ^ << >> ++ -- = += -= *= /=`
```js
import subscript from 'subscript'

subscript('a.b + c * 2')({ a: { b: 1 }, c: 3 })  // 7
```

**justin** — + JSON, arrows, templates:<br>
`` 'str' 0x 0b === !== ** ?? >>> ?. ? : => ... [] {} ` // /**/ true false null ``
```js
import justin from 'subscript/justin.js'

justin('{ x: a?.b ?? 0, y: [1, ...rest] }')({ a: null, rest: [2, 3] })
// { x: 0, y: [1, 2, 3] }
```

**jessie** — + statements, functions:<br>
`if else for while do let const var function class return throw try catch switch import export /regex/`
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

Jessie can parse and compile its own source.


## Parse / Compile

Subscript exposes `parse` to build AST and `compile` to create evaluators.

```js
import { parse, compile } from 'subscript'

// parse expression
let tree = parse('a.b + c - 1')
tree // ['-', ['+', ['.', 'a', 'b'], 'c'], [,1]]

// compile tree to evaluable function
fn = compile(tree)
fn({ a: {b: 1}, c: 2 }) // 2
```

## Extension

```js
import { binary, operator, compile } from 'subscript/justin.js'

// add intersection operator
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

See [docs.md](./docs.md) for full API.


## Syntax Tree

Expressions parse to a minimal JSON-compatible AST:

```js
import { parse } from 'subscript'

parse('a + b * 2')
// ['+', 'a', ['*', 'b', [, 2]]]
```

AST has simplified lispy tree structure (inspired by [frisk](https://ghub.io/frisk) / [nisp](https://github.com/ysmood/nisp)), opposed to [ESTree](https://github.com/estree/estree):

* not limited to particular language (JS), can be compiled to different targets;
* reflects execution sequence, rather than code layout;
* has minimal overhead, directly maps to operators;
* simplifies manual evaluation and debugging;
* has conventional form and one-liner docs:

Three forms:

```js
'x'             // identifier — resolve from context
[, value]       // literal — return as-is (empty slot = data)
[op, ...args]   // operation — apply operator
```

See [spec.md](./spec.md).


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

```
Parse 30k:  subscript 150ms · justin 183ms · jsep 270ms · expr-eval 480ms · jexl 1056ms
Eval 30k:   new Function 7ms · subscript 15ms · jsep+eval 30ms · expr-eval 72ms
```

## Utils

### Stringify

To convert tree back to code, there's codegenerator function:

```js
import { stringify } from 'subscript.js'

stringify(['+', ['*', 'min', [,60]], [,'sec']])
// 'min * 60 + "sec"'
```

## Bundle

Create custom dialect as single file:

```js
import { bundle } from 'subscript/util/bundle.js'

const code = await bundle('subscript/jessie.js')
// → self-contained ES module
```


## Used by

* [jz](https://github.com/dy/jz) — JS subset → WASM compiler
<!-- * [prepr](https://github.com/dy/prepr) -->
<!-- * [glsl-transpiler](https://github.com/stackgl/glsl-transpiler) -->
<!-- * [piezo](https://github.com/dy/piezo) -->


## Refs

[jsep](https://github.com/EricSmekens/jsep), [jexl](https://github.com/TomFrost/Jexl), [expr-eval](https://github.com/silentmatt/expr-eval), [math.js](https://mathjs.org/).

<!-- [mozjexl](https://github.com/mozilla/mozjexl), [jexpr](https://github.com/justinfagnani/jexpr), [expression-eval](https://github.com/donmccurdy/expression-eval), [string-math](https://github.com/devrafalko/string-math), [nerdamer](https://github.com/jiggzson/nerdamer), [math-codegen](https://github.com/mauriciopoppe/math-codegen), [math-parser](https://www.npmjs.com/package/math-parser), [nx-compile](https://github.com/nx-js/compiler-util), [built-in-math-eval](https://github.com/mauriciopoppe/built-in-math-eval) -->

<p align=center><a href="https://github.com/krsnzd/license/">ॐ</a></p>
