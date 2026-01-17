# sub✦script <a href="https://github.com/dy/subscript/actions/workflows/node.js.yml"><img src="https://github.com/dy/subscript/actions/workflows/node.js.yml/badge.svg"/></a> <a href="https://bundlejs.com/?q=subscript"><img alt="npm bundle size" src="https://img.shields.io/bundlejs/size/subscript"/></a> <a href="http://npmjs.org/subscript"><img src="https://img.shields.io/npm/v/subscript"/></a> <a href="http://microjs.com/#subscript"><img src="https://img.shields.io/badge/microjs-subscript-blue?color=darkslateblue"/></a>
[**Try it →**](https://dy.github.io/subscript/repl.html)

> _Subscript_ is safe & tiny expression evaluator for building DSLs.

define, parse, and execute expressions safely

* Parse + evaluate expressions
* Sandboxed evaluation
* Code analysis, transformation


```js
import subscript from 'subscript'

const fn = subscript`a + b * 2`
fn({ a: 1, b: 3 })  // 7
```

See [full API](./api.md)


* **Generic** — not JS-specific, supports various language syntaxes
* **Universal expression format** — language-agnostic tree structure
* **Cross-compilation** — parser separate from compiler, same AST → JS/C/WASM
* **Safe eval** — security sandbox with blocked globals, __proto__, constructor
* **Fast** — best in class parsing, minimal overhead
  * 2x faster than popular alternative
* **Language design** — modular pluggable sytax features for prototyping custom DSL
* **Homoiconic, metacircular** – jessie can parse and compile own source (js in js runtime)
* Turbo Pratt parser engine (make a pun here)
* **Smallest JS runtime**

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


## Dialects

**default** — minimal common syntax
```js
import expr from 'subscript/parse/expr.js'
expr('a.b + c * 2')
```

**justin** — JSON + expressions (no keywords)
```js
import justin from 'subscript/parse/justin.js'
justin('{ x: a?.b ?? 0, y: [1, 2, ...rest] }')
```

**jessie** — practical JS subset (functions, loops, everything)
```js
import jessie from 'subscript/parse/jessie.js'
jessie(`
  function factorial(n) {
    if (n <= 1) return 1
    return n * factorial(n - 1)
  }
  factorial(5)
`)({})  // 120
```

See [docs](./API.md)



### Default

Minimal ([common syntax](https://en.wikipedia.org/wiki/Comparison_of_programming_languages_(syntax)) for _JavaScript_, _C_, _C++_, _Java_, _C#_, _PHP_, _Swift_, _Objective-C_, _Kotlin_, _Perl_ etc.):

* - assignment: = += etc (base ops registered first)
* - logical: ! && || ??
* - bitwise: | & ^ ~ >> << >>>
* - comparison: < > <= >=
* - equality: == != === !==
* - membership: in of instanceof
* - arithmetic: + - * / %
* - pow: ** **=
* - increment: ++ --
* - literal: true, false, null, undefined, NaN, Infinity

* `a.b`, `a[b]`, `a(b)` — member access, calls
* `+a`, `-a`, `!a` — unary
* `a + b`, `a - b`, `a * b`, `a / b`, `a % b` — arithmetic
* `a < b`, `a <= b`, `a > b`, `a >= b`, `a == b`, `a != b` — comparison
* `"abc"`, `0.1`, `1.2e+3` — literals

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

_Just-in_ is no-keywords JS subset, _JSON_ + _expressions_ ([Jessie thread](https://github.com/endojs/Jessie/issues/66)).<br/>
It extends _expr_ with:

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
+ `true`, `false`, `null`, `undefined`, `NaN`, `Infinity`
+ `a in b`, `a instanceof b`
+ `` `a ${x} b` ``, `` tag`...` ``

```js
import justin from 'subscript/parse/justin.js'

let fn = justin('{ x: 1, "y": 2+2 }["x"]')
fn()  // 1
```

### Jessie

Extends Justin with statements — practical JS subset inspired by [Jessie](https://github.com/endojs/Jessie).

+ `if (c) a`, `if (c) a else b`
+ `while (c) body`, `do { body } while (c)`
+ `for (init; cond; step) body`, `for (x of iter) body`, `for (x in obj) body`
+ `{ a; b }` — block scope
+ `let x`, `const x = 1`, `var x = 1`, `const {a, b} = x`
+ `break`, `continue`, `return x`
+ `throw x`, `try { } catch (e) { } finally { }`
+ `function f(a, b) { }`, `function(x) { }`, `function f(...args) {}`
+ `typeof x`, `void x`, `delete x`, `x instanceof Y`
+ `new X()`, `new X(a, b)`
+ `import`, `export`
+ `switch (x) { case a: ...; default: ... }`
+ `{ get x() {}, set y(v) {} }`
+ `/pattern/flags`

```js
import jessie from 'subscript/parse/jessie.js'

let fac = jessie(`
  function fac(n) {
    if (n <= 1) return 1;
    return n * fac(n - 1)
  };
  fac(5)
`)
fac({}) // 120
```


### Expression format

Subscript uses simplified lispy syntax tree:

```js
import { parse } from 'subscript'

parse('a + b * 2')
// ['+', 'a', ['*', 'b', [, 2]]]
```

* portable to any language, not limited to JS;
* reflects execution sequence, rather than code layout;
* has minimal overhead, directly maps to operators;
* simplifies manual evaluation and debugging;
* has conventional form and one-liner docs:

Three forms. That's the entire AST:

```js
'name'              // identifier — resolve from context
[, value]           // literal — return as-is
[op, ...args]       // operation — apply operator
```

See [full spec](./AST.md).


## Extension

Add a set intersection operator:

```js
import { binary } from 'subscript'
import { operator, compile } from 'subscript/compile/js.js'

binary('∩', 80)  // register syntax
operator('∩', (a, b) => (a = compile(a), b = compile(b),
  ctx => a(ctx).filter(x => b(ctx).includes(x))))

subscript('[1,2,3] ∩ [2,3,4]')({})  // [2, 3]
```

Add units:

```js
import { token } from 'subscript/parse/pratt.js'

token('px', 200, n => n && [, n[1] + 'px'])  // 5px → "5px"
token('em', 200, n => n && [, n[1] + 'em'])
```

See [feature/](./feature) for 30+ built-in operators.


## Safety

Blocked by default:
- `__proto__`, `__defineGetter__`, `__defineSetter__`
- `constructor`, `prototype`
- Global access (only context is visible)

```js
subscript('constructor.constructor("alert(1)")()')({})
// Error: unsafe property access
```

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
```
<!--
justin: ~183 ms
mr-parser: ~420 ms
expr-eval: ~480 ms
math-parser: ~570 ms
math-expression-evaluator: ~900ms
jexl: ~1056 ms
mathjs: ~1200 ms
new Function: ~1154 ms
-->

Eval 30k times:

```
new Function: ~7 ms 🥇
subscript: ~15 ms 🥈
jexpr: ~23 ms 🥉
jsep (expression-eval): ~30 ms
```
<!--
justin: ~17 ms
math-expression-evaluator: ~50ms
expr-eval: ~72 ms
jexl: ~110 ms
mathjs: ~119 ms
mr-parser: -
math-parser: -
-->


> Run `node --import ./test/https-loader.js test/benchmark.js` for full benchmarks


## API Reference

### Parser

```js
import { parse, token, binary, unary, nary, group, access, literal } from 'subscript/parse/pratt.js'

binary(op, precedence, rightAssoc?)   // a + b
unary(op, precedence, postfix?)       // -a or a++
nary(op, precedence)                  // a, b, c
group(op, precedence)                 // (a)
access(op, precedence)                // a[b]
literal(op, value)                    // null → [, null]
token(op, prec, fn)                   // custom pattern
```

### Compiler

```js
import { compile, operator, operators } from 'subscript/compile/js.js'
import { codegen } from 'subscript/compile/js-emit.js'

compile(tree)        // AST → evaluator function
operator(op, fn)     // register operator compiler
codegen(tree)        // AST → JS source string
```


## Used by

* [jz](https://github.com/dy/jz) — JS subset → WASM compiler
<!-- * [prepr](https://github.com/dy/prepr) -->
<!-- * [glsl-transpiler](https://github.com/stackgl/glsl-transpiler) -->
<!-- * [piezo](https://github.com/dy/piezo) -->

---

## See Also

[jsep](https://github.com/EricSmekens/jsep), [jexl](https://github.com/TomFrost/Jexl), [expr-eval](https://github.com/silentmatt/expr-eval), [math.js](https://mathjs.org/) and others.

<!-- [mozjexl](https://github.com/mozilla/mozjexl), [jexpr](https://github.com/justinfagnani/jexpr), [expression-eval](https://github.com/donmccurdy/expression-eval), [string-math](https://github.com/devrafalko/string-math), [nerdamer](https://github.com/jiggzson/nerdamer), [math-codegen](https://github.com/mauriciopoppe/math-codegen), [math-parser](https://www.npmjs.com/package/math-parser), [nx-compile](https://github.com/nx-js/compiler-util), [built-in-math-eval](https://github.com/mauriciopoppe/built-in-math-eval) -->

<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
