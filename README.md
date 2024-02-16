# <img alt="subscript" src="/subscript2.svg" height=28/> <!--sub͘<em>script</em>--> <!--<sub>SUB͘<em>SCRIPT</em></sub>--> <a href="https://github.com/spectjs/subscript/actions/workflows/node.js.yml"><img src="https://github.com/spectjs/subscript/actions/workflows/node.js.yml/badge.svg"/></a> <a href="https://bundlephobia.com/package/subscript"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/subscript/latest?color=brightgreen&label=gzip"/></a> <a href="http://npmjs.org/subscript"><img src="https://img.shields.io/npm/v/subscript"/></a> <a href="http://microjs.com/#subscript"><img src="https://img.shields.io/badge/microjs-subscript-blue?color=darkslateblue"/></a>

_Subscript_ is fast, tiny & extensible expression evaluator / microlanguage.

Used for:

* templates (eg. [sprae](https://github.com/dy/sprae), [templize](https://github.com/dy/templize))
* expressions evaluators, calculators
* subsets of languages (eg. [justin](#justin))
* pluggable/configurable/mock language features (eg. pipe operator)
* sandboxes, playgrounds, safe eval
* custom DSL (see [mell](https://github.com/dy/lino)) <!-- uneural -->
* preprocessors (see [prepr](https://github.com/dy/prepr))

_Subscript_ has [3.5kb](https://npmfs.com/package/subscript/7.4.3/subscript.min.js) footprint, compared to [11.4kb](https://npmfs.com/package/jsep/1.2.0/dist/jsep.min.js) _jsep_ + [4.5kb](https://npmfs.com/package/expression-eval/5.0.0/dist/expression-eval.module.js) _expression-eval_, with better test coverage and [better performance](#performance).


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

_Subscript_ supports [common syntax](https://en.wikipedia.org/wiki/Comparison_of_programming_languages_(syntax)) (supported by main languages: _JavaScript_, _C_/_C++_, _Java_, _Rust_ etc.):

* `a.b`, `a[b]`, `a(b)`
* `a++`, `a--`, `++a`, `--a`
* `a * b`, `a / b`, `a % b`
* `+a`, `-a`, `a + b`, `a - b`
* `a < b`, `a <= b`, `a > b`, `a >= b`, `a == b`, `a != b`
* `~a`, `a & b`, `a ^ b`, `a | b`, `a << b`, `a >> b`
* `!a`, `a && b`, `a || b`
* `a = b`, `a += b`, `a -= b`, `a *= b`, `a /= b`, `a %= b`
* `(a, (b))`, `a; b;`
* `"abc"`, `'abc'`
* `0.1`, `1.2e+3`

### Justin

_Justin_ is minimal JS subset, _JSON_ with expressions (see [thread](https://github.com/endojs/Jessie/issues/66)).<br/>

It extends _subscript_ with:

+ `a ** b` (right-assoc)
+ `a ? b : c`
+ `a?.b`
+ `[a, b]` Array
+ `{a: b}` Object
+ `a in b`
+ `// foo`, `/* bar */`
+ `true`, `false`, `null`
<!-- + `...x` unary operator -->
<!-- + strings interpolation -->

```js
import jstin from './justin.js'

let xy = jstin('{ x: 1, "y": 2+2 }["x"]')
xy()  // 1
```


## Parse / Compile

Subscript exposes `parse` and `compile` functions. <br/>
Parser builds AST, compiler creates evaluator function.

```js
import { parse, compile } from 'subscript'

// parse expression
let tree = parse('a.b + c - 1')
tree // ['-', ['+', ['.', 'a', 'b'], 'c'], [,1]]

// compile tree to evaluable function
fn = compile(tree)
fn({ a: {b: 1}, c: 2 }) // 3
```

## Syntax Tree

AST has simplified lispy tree structure (inspired by [frisk](https://ghub.io/frisk) / [nisp](https://github.com/ysmood/nisp)), opposed to [ESTree](https://github.com/estree/estree):

* not limited to particular language (JS), can be compiled to different targets;
* reflects execution sequence, rather than code layout;
* has minimal overhead, directly maps to operators;
* simplifies manual evaluation and debugging;
* has conventional form and one-line docs:

```js
import { compile } from 'subscript.js'

const fn = compile(['+', ['*', 'min', [,60]], [,'sec']])

fn({min: 5}) // min*60 + "sec" == "300sec"
```

## Extending

_Subscript_ defines set of pluggable syntax features, that can be used as basic blocks for designing a dialect:

Name | Syntax
---|---
`./feature/access.js` | `a.b`, `a[b]`
`./feature/add.js` | `-a`, `+a`, `a+b`, `a-b`, `a-=b`, `a+=b`
`./feature/array.js` | `[a, [b, c]]`
`./feature/assign.js` | `a=b`
`./feature/bitwise.js` | `~a`, `a|b`, `a&b`, `a^b`
`./feature/bool.js` | `true`, `false`
`./feature/call.js` | `a(b, c+d)`
`./feature/comment.js` | `// a`, `/* b */`
`./feature/compare.js` | `a==b`, `a!=b`, `a>=b`, `a<=b`, `a>b`, `a<b`
`./feature/group` | `(a, (b, c));`
`./feature/increment.js` | `a++`, `a--`, `--a`, `++a`
`./feature/logic.js` | `!a`, `a&&b`, `a||b`
`./feature/mult.js` | `a/b`, `a*b`, `a%b`, `a*=b`, `a/=b`, `a%=b`
`./feature/number.js` | `1.23`, `4e-5`
`./feature/object.js` | `{a: {"b": c}}`
`./feature/string.js` | `'abc'`, `"def"`
`./feature/ternary.js` | `a ? b : c`

To add a feature, just import it: `import 'subscript/feature/ternary.js'`.

### Customizing

_Subscript_ provides API to define custom syntax:

* `unary(str, precedence, postfix=false)` − register unary operator, either prefix or postfix.
* `binary(str, precedence, rightAssoc=false)` − register binary operator, optionally right-associative.
* `nary(str, precedence, allowSkip=false)` − register n-ary (sequence) operator, optionally allowing skipping args.
* `token(str, precedence, prevNode => curNode)` − register custom token or literal. Function takes last token and returns tree node.
* `operator(str, (a, b) => ctx => result)` − register evaluator for an operator. Function takes node arguments and returns evaluator function.

```js
import script, { compile, operator, unary, binary, token } from './subscript.js'

// add identity operators with precedence 9
binary('===', 9), binary('!==', 9)
operator('===', (a, b) => ctx => ctx[a]===ctx[b])
operator('!==', (a, b) => ctx => ctx[a]!==ctx[b])

// add JS literals
token('undefined', 20, a => a ? err() : [, undefined])
token('NaN', 20, a => a ? err() : [, NaN])

// add logical OR assignment
binary('||=', PREC_ASSIGN)
operator('||=', (a, b) => {
  let obj, path, val = compile(b)
  // a ||= b
  typeof a === 'string' ? ctx => ctx[a] ||= val(ctx) :
  // a.b ||= c
  a[0] === '.' ? (obj = compile(a[1]), path = a[2], ctx => obj(ctx)[path] ||= val(ctx)) :
  // a[b] ||= c
  a[0] === '[' ? (obj = compile(a[1]), path = compile(a[2]), ctx => obj(ctx)[path(ctx)] ||= val(ctx))
})
```

See [`./feature/*`](./feature) for examples.



<!--
## Ideas

These are custom DSL operators snippets for your inspiration:


```html
template-parts proposal
<template id="timer">
  <time datetime="{{ date.toUTCString() }}">{{ date.toLocaleTimeString() }}</time>
</template>
```

* Keyed arrays <code>[a:1, b:2, c:3]</code>
* 7!` (factorial)
* `5s`, `5rem` (units)
* `?`, `?.`, `??`
* `arrᵀ` - transpose
* `int 5` (typecast)
* `$a` (param expansion)
* `1 to 10 by 2`
* `a if b else c`
* `a, b in c`
* `a.xyz` swizzles
* vector operators
* set operators
* polynomial operators

like versions, units, hashes, urls, regexes etc

2a as `2*a`

string interpolation ` ${} 1 ${} `
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

* [jexpr](https://github.com/justinfagnani/jexpr)
* [jsep](https://github.com/EricSmekens/jsep)
* [jexl](https://github.com/TomFrost/Jexl)
* [mozjexl](https://github.com/mozilla/mozjexl)
* [expr-eval](https://github.com/silentmatt/expr-eval)
* [expression-eval](https://github.com/donmccurdy/expression-eval)
* [string-math](https://github.com/devrafalko/string-math)
* [nerdamer](https://github.com/jiggzson/nerdamer)
* [math-codegen](https://github.com/mauriciopoppe/math-codegen)
* [math-parser](https://www.npmjs.com/package/math-parser)
* [math.js](https://mathjs.org/docs/expressions/parsing.html)
* [nx-compile](https://github.com/nx-js/compiler-util)
* [built-in-math-eval](https://github.com/mauriciopoppe/built-in-math-eval)

<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
