# sub<em>script</em> <a href="https://github.com/spectjs/subscript/actions/workflows/node.js.yml"><img src="https://github.com/spectjs/subscript/actions/workflows/node.js.yml/badge.svg"/></a> <a href="https://bundlejs.com/?q=subscript"><img alt="npm bundle size" src="https://img.shields.io/bundlejs/size/subscript"/></a> <a href="http://npmjs.org/subscript"><img src="https://img.shields.io/npm/v/subscript"/></a> <a href="http://microjs.com/#subscript"><img src="https://img.shields.io/badge/microjs-subscript-blue?color=darkslateblue"/></a>

> _Subscript_ is fast, tiny & extensible parser / evaluator / microlanguage with standard syntax.

####  Used for:

* expressions evaluators, calculators 
* subsets of languages (eg. [jasm](https://github.com/dy/jasm), [justin](#justin))
* sandboxes, playgrounds, safe eval (eg. [glsl-transpiler](https://github.com/stackgl/glsl-transpiler))
* custom DSL (eg. [piezo](https://github.com/dy/piezo)) <!-- uneural -->
* preprocessors (eg. [prepr](https://github.com/dy/prepr))
* templates (eg. [sprae](https://github.com/dy/sprae))

_Subscript_ has [3.5kb](https://npmfs.com/package/subscript/7.4.3/subscript.min.js) footprint (compare to [11.4kb](https://npmfs.com/package/jsep/1.2.0/dist/jsep.min.js) _jsep_ + [4.5kb](https://npmfs.com/package/expression-eval/5.0.0/dist/expression-eval.module.js) _expression-eval_), best [performance](#performance) and extensive test coverage.


## Usage

```js
import subscript from './subscript.js'

// parse expression
const fn = subscript('a.b + Math.sqrt(c - 1)')

// evaluate with context
fn({ a: { b:1 }, c: 5, Math })
// 3
```

## Operators

_Subscript_ supports [common syntax](https://en.wikipedia.org/wiki/Comparison_of_programming_languages_(syntax)) (_JavaScript_, _C_, _C++_, _Java_, _C#_, _PHP_, _Swift_, _Objective-C_, _Kotlin_, _Perl_ etc.):

* `a.b`, `a[b]`, `a(b)`
* `a++`, `a--`, `++a`, `--a`
* `a * b`, `a / b`, `a % b`
* `+a`, `-a`, `a + b`, `a - b`
* `a < b`, `a <= b`, `a > b`, `a >= b`, `a == b`, `a != b`
* `~a`, `a & b`, `a ^ b`, `a | b`, `a << b`, `a >> b`
* `!a`, `a && b`, `a || b`
* `a = b`, `a += b`, `a -= b`, `a *= b`, `a /= b`, `a %= b`, , `a <<= b`, `a >>= b`
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
+ `a ? b : c`, `a?.b`
+ `...a`
+ `[a, b]`
+ `{a: b}`
+ `(a, b) => c`
+ `// foo`, `/* bar */`
+ `true`, `false`, `null`, `NaN`, `undefined`
+ `a in b`
<!-- + strings interpolation -->

```js
import jstin from './justin.js'

let xy = jstin('{ x: 1, "y": 2+2 }["x"]')
xy()  // 1
```


## Parse / Compile

Subscript exposes `parse` to build AST and `compile` to create evaluators.

```js
import { parse, compile } from 'subscript'

// parse expression
let tree = parse('a.b + c - 1')
tree // ['-', ['+', ['.', 'a', 'b'], 'c'], [,1]]

// compile tree to evaluable function
fn = compile(tree)
fn({ a: {b: 1}, c: 2 }) // 3
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
['+', a];         // unary operator `+a`
['+', a, b];      // binary operator `a + b`
['+', a, b, c];   // n-ary operator `a + b + c`
['()', a];        // group operator `(a)`
['()', a, b];     // access operator `a(b)`
[, 'a'];          // literal value `'a'`
a;                // variable (from scope)
null;             // placeholder

// eg.
['()', 'a']       // (a)
['()', 'a',,]     // a()
['()', 'a', 'b'] // a(b)
['+',1] // +1
['+',1,,] // 1+
```

### Stringify

To convert tree back to code, there's codegenerator function:

```js
import { stringify } from 'subscript.js'

stringify(['+', ['*', 'min', [,60]], [,'sec']])
// 'min*60 + "sec" == "300sec"'
```

## Extending

_Subscript_ provides premade language [features](./features) and API to customize syntax:

* `unary(str, precedence, postfix=false)` − register unary operator, either prefix `⚬a` or postfix `a⚬`.
* `binary(str, precedence, rassoc=false)` − register binary operator `a ⚬ b`, optionally right-associative.
* `nary(str, precedence)` − register n-ary (sequence) operator like `a; b;` or `a, b`, allows missing args.
* `group(str, precedence)` - register group, like `[a]`, `{a}`, `(a)` etc.
* `access(str, precedence)` - register access operator, like `a[b]`, `a(b)` etc.
* `token(str, precedence, lnode => node)` − register custom token or literal. Callback takes left-side node and returns complete expression node.
* `operator(str, (a, b) => ctx => value)` − register evaluator for an operator. Callback takes node arguments and returns evaluator function.

Longer operators should be registered after shorter ones, eg. first `|`, then `||`, then `||=`.

```js
import script, { compile, operator, unary, binary, token } from './subscript.js'

// enable objects/arrays syntax
import 'subscript/feature/array.js';
import 'subscript/feature/object.js';

// add identity operators (precedence of comparison)
binary('===', 9), binary('!==', 9)
operator('===', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx)===b(ctx)))
operator('===', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx)!==b(ctx)))

// add nullish coalescing (precedence of logical or)
binary('??', 3)
operator('??', (a, b) => b && (a = compile(a), b = compile(b), ctx => a(ctx) ?? b(ctx)))

// add JS literals
token('undefined', 20, a => a ? err() : [, undefined])
token('NaN', 20, a => a ? err() : [, NaN])
```

See [`./feature/*`](./feature) or [`./justin.js`](./justin.js) for examples.


<!--
## Ideas

* Keyed arrays <code>[a:1, b:2, c:3]</code>
* 7!` (factorial)
* `5s`, `5rem` (units)
* `arrᵀ` - transpose
* `int 5` (typecast)
* `$a` (parameter expansion)
* `1 to 10 by 2`
* `a if b else c`
* `a, b in c`
* `a.xyz` swizzles
* vector operators
* set operators
* polynomial operators
* versions
* hashes, urls
* regexes
* 2a as `2*a`
* string interpolation ` ${} 1 ${} `
-->

## Performance

Subscript shows good performance within other evaluators. Example expression:

```
1 + (a * b / c % d) - 2.0 + -3e-3 * +4.4e4 / f.g[0] - i.j(+k == 1)(0)
```

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
```

Eval 30k times:
```
new Function: ~7 ms 🥇
subscript: ~15 ms 🥈
justin: ~17 ms
jexpr: ~23 ms 🥉
jsep (expression-eval): ~30 ms
math-expression-evaluator: ~50ms
expr-eval: ~72 ms
jexl: ~110 ms
mathjs: ~119 ms
mr-parser: -
math-parser: -
```

## Alternatives

[jexpr](https://github.com/justinfagnani/jexpr), [jsep](https://github.com/EricSmekens/jsep), [jexl](https://github.com/TomFrost/Jexl), [mozjexl](https://github.com/mozilla/mozjexl), [expr-eval](https://github.com/silentmatt/expr-eval), [expression-eval](https://github.com/donmccurdy/expression-eval), [string-math](https://github.com/devrafalko/string-math), [nerdamer](https://github.com/jiggzson/nerdamer), [math-codegen](https://github.com/mauriciopoppe/math-codegen), [math-parser](https://www.npmjs.com/package/math-parser), [math.js](https://mathjs.org/docs/expressions/parsing.html), [nx-compile](https://github.com/nx-js/compiler-util), [built-in-math-eval](https://github.com/mauriciopoppe/built-in-math-eval)

<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
