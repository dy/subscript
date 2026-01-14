# sub*script* <a href="https://github.com/dy/subscript/actions/workflows/node.js.yml"><img src="https://github.com/dy/subscript/actions/workflows/node.js.yml/badge.svg"/></a> <a href="https://bundlejs.com/?q=subscript"><img alt="npm bundle size" src="https://img.shields.io/bundlejs/size/subscript"/></a> <a href="http://npmjs.org/subscript"><img src="https://img.shields.io/npm/v/subscript"/></a> <a href="http://microjs.com/#subscript"><img src="https://img.shields.io/badge/microjs-subscript-blue?color=darkslateblue"/></a>

> _Subscript_ is safe & tiny expression evaluator for building DSLs.

[**Try it →**](https://dy.github.io/subscript/repl.html)

* **Generic** — not JS-specific, supports various language syntaxes
* **Universal AST** — consistent tree structure
* **Portable** — parser separate from compiler, targets JS/C/WASM
* **Safe sandbox** — no access to globals
* **Fastest in class** — minimal overhead
* **Extensible** — pluggable operators and features
* Homoiconic, metacircular – compiles itself

<!--
####  Useful for:

* expressions evaluators, calculators
* subsets of languages
* sandboxes, playgrounds, safe eval
* custom DSL
* preprocessors
* templates
-->


<!--
_Subscript_ has ~[2kb](https://npmfs.com/package/subscript/7.4.3/subscript.min.js) footprint  (compare to [11.4kb](https://npmfs.com/package/jsep/1.2.0/dist/jsep.min.js) _jsep_ + [4.5kb](https://npmfs.com/package/expression-eval/5.0.0/dist/expression-eval.module.js) _expression-eval_) , good [performance](#performance) and extensive test coverage.
-->


## Usage

```js
import subscript from './subscript.js'

// parse expression
const fn = subscript('a.b + Math.sqrt(c - 1)')

// evaluate with context
fn({ a: { b:1 }, c: 5, Math })
// 3
```

### Core

_Subscript_ supports [common syntax](https://en.wikipedia.org/wiki/Comparison_of_programming_languages_(syntax)) (_JavaScript_, _C_, _C++_, _Java_, _C#_, _PHP_, _Swift_, _Objective-C_, _Kotlin_, _Perl_ etc.):

* `a.b`, `a[b]`, `a(b)`
* `a++`, `a--`, `++a`, `--a`
* `a * b`, `a / b`, `a % b`
* `+a`, `-a`, `a + b`, `a - b`
* `a < b`, `a <= b`, `a > b`, `a >= b`, `a == b`, `a != b`
* `~a`, `a & b`, `a ^ b`, `a | b`, `a << b`, `a >> b`
* `!a`, `a && b`, `a || b`
* `a = b`, `a += b`, `a -= b`, `a *= b`, `a /= b`, `a %= b`, `a <<= b`, `a >>= b`
* `(a, (b))`, `a; b;`
* `"abc"`, `'abc'`
* `0.1`, `1.2e+3`


### Justin

_Just-in_ is no-keywords JS subset, _JSON_ + _expressions_ (see [thread](https://github.com/endojs/Jessie/issues/66)).<br/>
It extends _subscript_ with:

+ `a === b`, `a !== b`
+ `a ** b`, `a **= b`
+ `a ?? b`, `a ??= b`
+ `a ||= b`, `a &&= b`
+ `a >>> b`, `a >>>= b`
+ `a ? b : c`, `a?.b`, `a?.[b]`, `a?.(b)`
+ `...a`
+ `[a, b]`, `{a: b}`, `{a}`
+ `(a, b) => c`
+ `// foo`, `/* bar */`
+ `true`, `false`, `null`, `NaN`, `undefined`
+ `a in b`
+ `` `a ${x} b` ``, `` tag`...` ``

```js
import justin from 'subscript/justin.js'

let fn = justin('{ x: 1, "y": 2+2 }["x"]')
fn()  // 1
```

### Jessie

Extends Justin with statements — practical JS subset inspired by [Jessie](https://github.com/endojs/Jessie).

+ `if (c) a`, `if (c) a else b`
+ `while (c) body`
+ `for (init; cond; step) body`, `for (x of iter) body`
+ `{ a; b }` — block scope
+ `let x`, `const x = 1`, `const {a, b} = x`
+ `break`, `continue`, `return x`
+ `throw x`, `try { } catch (e) { } finally { }`
+ `function f(a, b) { }`, `function(x) { }`, `function f(...args) {}`
+ `typeof x`
+ `import`, `export`
+ `switch (x) { case a: ...; default: ... }`
+ `{ get x() {}, set y(v) {} }`
+ `/pattern/flags`

```js
import jessie from 'subscript/jessie.js'

let fac = jessie(`
  function fac(n) {
    if (n <= 1) return 1;
    return n * fac(n - 1)
  };
  fac(5)
`)
fac({}) // 120
```

#### Extras

+ `5px`, `10rem` — unit suffixes — `feature/unit.js`


## Architecture

Subscript separates **parsing** (syntax → AST) from **compilation** (AST → target).

### Parser Presets

```
expr.js      → justin.js      → jessie.js
(minimal)      (JSON+expr)      (JS subset)
```

Presets are parse-only — import a compiler separately or use the default bundle.

### Compilers

```
compile/js.js       — AST → closures (direct eval)
compile/js-emit.js  — AST → JS source string
```

Future: `c-emit.js`, `wat-emit.js`, `wasm.js`

### Usage

```js
import { parse, compile } from 'subscript'

// parse expression
let tree = parse('a.b + c - 1')
tree // ['-', ['+', ['.', 'a', 'b'], 'c'], [,1]]

// compile tree to evaluable function
fn = compile(tree)
fn({ a: {b: 1}, c: 2 }) // 2
```

### Parser-only

```js
import './justin.js'  // just the parser preset
import { parse } from './src/parse.js'
import { compile } from './compile/js.js'  // pick your compiler

const tree = parse('a + b')
const fn = compile(tree)
```

## Util

```js
// ASI (Automatic Semicolon Insertion) for multiline code
import { withASI } from 'subscript/util/asi.js'
import { parse, compile } from 'subscript/jessie.js'

const asiParse = withASI(parse)
const tree = asiParse(`
  x = 1
  y = 2
  x + y
`)
compile(tree)({}) // 3
```


### Syntax Tree

AST has simplified lispy tree structure (inspired by [frisk](https://ghub.io/frisk) / [nisp](https://github.com/ysmood/nisp)), opposed to [ESTree](https://github.com/estree/estree):

* not limited to particular language (JS), can be compiled to different targets;
* reflects execution sequence, rather than code layout;
* has minimal overhead, directly maps to operators;
* simplifies manual evaluation and debugging;
* has conventional form and one-liner docs:

```js
import { compile } from 'subscript.js'

const fn = compile(['+', ['*', 'min', [,60]], [,'sec']])
fn({min: 5}) // min*60 + "sec" == "300sec"

// node kinds
'a'                // identifier — variable from scope
[, value]          // literal — [0] empty distinguishes from operator
[op, a]            // unary — prefix operator
[op, a, null]      // unary — postfix operator (null marks postfix)
[op, a, b]         // binary
[op, a, b, c]      // n-ary / ternary

// operators
['+', a, b]        // a + b
['.', a, 'b']      // a.b — property access
['[]', a, b]       // a[b] — bracket access
['()', a]          // (a) — grouping
['()', a, b]       // a(b) — function call
['()', a, null]    // a() — call with no args

// literals & structures
[, 1]              // 1
[, 'hello']        // "hello"
['[]', [',', ...]] // [a, b] — array literal
['{}', [':', ...]] // {a: b} — object literal

// justin extensions
['?', a, b, c]     // a ? b : c — ternary
['=>', params, x]  // (a) => x — arrow function
['...', a]         // ...a — spread

// control flow (extra)
['if', cond, then, else]
['while', cond, body]
['for', init, cond, step, body]

// postfix example
['++', 'a']        // ++a
['++', 'a', null]  // a++
['px', [,5]]       // 5px (unit suffix)
```

### Codegen

To convert tree back to JS source:

```js
import { codegen } from 'subscript.js'

codegen(['+', ['*', 'min', [,60]], [,'sec']])
// '(min * 60) + "sec"'
```

## Extending

_Subscript_ provides premade language [features](./feature) and API to customize syntax.

### Parser API

* `unary(str, precedence, postfix=false)` − register unary operator, either prefix `⚬a` or postfix `a⚬`.
* `binary(str, precedence, rassoc=false)` − register binary operator `a ⚬ b`, optionally right-associative.
* `nary(str, precedence)` − register n-ary (sequence) operator like `a; b;` or `a, b`, allows missing args.
* `group(str, precedence)` - register group, like `[a]`, `{a}`, `(a)` etc.
* `access(str, precedence)` - register access operator, like `a[b]`, `a(b)` etc.
* `token(str, precedence, lnode => node)` − register custom token or literal. Callback takes left-side node and returns complete expression node.

Longer operators should be registered after shorter ones, eg. first `|`, then `||`, then `||=`.

### Compiler API

* `operator(str, (a, b) => ctx => value)` − register evaluator for an operator. Callback takes node arguments and returns evaluator function.

```js
import { compile, operator } from './compile/js.js'
import { binary } from './src/parse.js'

// add identity operators (precedence of comparison)
binary('===', 9), binary('!==', 9)
operator('===', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx)===b(ctx)))
operator('!==', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx)!==b(ctx)))

// add nullish coalescing (precedence of logical or)
binary('??', 3)
operator('??', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) ?? b(ctx)))

// add JS literals
token('undefined', 20, a => a ? err() : [, undefined])
token('NaN', 20, a => a ? err() : [, NaN])
```

See [`./feature/*`](./feature) or [`./justin.js`](./justin.js) for examples.



## Performance

Subscript shows good performance within other evaluators. Example expression:

```
1 + (a * b / c % d) - 2.0 + -3e-3 * +4.4e4 / f.g[0] - i.j(+k == 1)(0)
```

Parse 30k times:

```
subscript: ~150 ms 🥇
jsep: ~270 ms 🥈
jexpr: ~297 ms 🥉
justin: ~183 ms
mr-parser: ~420 ms
expr-eval: ~480 ms
math-parser: ~570 ms
math-expression-evaluator: ~900ms
jexl: ~1056 ms
mathjs: ~1200 ms
new Function: ~1154 ms
```

Eval 30k times:

```
new Function: ~7 ms 🥇
subscript: ~15 ms 🥈
jexpr: ~23 ms 🥉
jsep (expression-eval): ~30 ms
justin: ~17 ms
math-expression-evaluator: ~50ms
expr-eval: ~72 ms
jexl: ~110 ms
mathjs: ~119 ms
```


## Used by

* [jz](https://github.com/dy/jz)
<!-- * [prepr](https://github.com/dy/prepr) -->
<!-- * [glsl-transpiler](https://github.com/stackgl/glsl-transpiler) -->
<!-- * [piezo](https://github.com/dy/piezo) -->


## Alternatives

[jexpr](https://github.com/justinfagnani/jexpr), [jsep](https://github.com/EricSmekens/jsep), [jexl](https://github.com/TomFrost/Jexl), [mozjexl](https://github.com/mozilla/mozjexl), [expr-eval](https://github.com/silentmatt/expr-eval), [expression-eval](https://github.com/donmccurdy/expression-eval), [string-math](https://github.com/devrafalko/string-math), [nerdamer](https://github.com/jiggzson/nerdamer), [math-codegen](https://github.com/mauriciopoppe/math-codegen), [math-parser](https://www.npmjs.com/package/math-parser), [math.js](https://mathjs.org/docs/expressions/parsing.html), [nx-compile](https://github.com/nx-js/compiler-util), [built-in-math-eval](https://github.com/mauriciopoppe/built-in-math-eval)

<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
