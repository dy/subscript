# <img alt="subscript" src="/subscript2.svg" height=28/> <!--sub͘<em>script</em>--> <!--<sub>SUB͘<em>SCRIPT</em></sub>--> <a href="https://github.com/spectjs/subscript/actions/workflows/node.js.yml"><img src="https://github.com/spectjs/subscript/actions/workflows/node.js.yml/badge.svg"/></a> <a href="https://bundlephobia.com/package/subscript"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/subscript/latest?color=brightgreen&label=gzip"/></a> <a href="http://npmjs.org/subscript"><img src="https://img.shields.io/npm/v/subscript"/></a> <a href="http://microjs.com/#subscript"><img src="https://img.shields.io/badge/microjs-subscript-blue?color=darkslateblue"/></a>

_Subscript_ is expression evaluator / microlanguage with [common syntax](https://en.wikipedia.org/wiki/Comparison_of_programming_languages_(syntax)) support and extensibility. It is easy, small & fast alternative to [jsep](https://ghub.io/jsep), [math.js](https://ghub.io/math.js) etc.<br/>

_Subscript_ is useful for:

* templates (eg. [sprae](https://github.com/dy/sprae), [templize](https://github.com/dy/templize))
* expressions evaluators, calculators
* subsets of languages (eg. [justin](#justin))
* pluggable/configurable/mock language features (eg. pipe operator)
* sandboxes, playgrounds, safe eval
* custom DSL (see [mell](https://github.com/dy/lino)) <!-- uneural -->
* preprocessors (see [prepr](https://github.com/dy/prepr))

_Subscript_ has [3.5kb](https://npmfs.com/package/subscript/7.4.3/subscript.min.js) footprint, compared to [11.4kb](https://npmfs.com/package/jsep/1.2.0/dist/jsep.min.js) _jsep_ + [4.5kb](https://npmfs.com/package/expression-eval/5.0.0/dist/expression-eval.module.js) _expression-eval_, with better test coverage and better performance.


## Usage

```js
import subscript from './subscript.js'

// parse expression
const fn = subscript('a.b + Math.sqrt(c - 1)')

// evaluate with passed context
fn({ a: { b:1 }, c: 5, Math })
// 3
```

## Operators

Default _subscript_ provides common-syntax operators, supported by main languages (_JavaScript_,_C_, _C++_, _Java_, _Rust_, _Go_, _Ruby_, _C#_,  _PHP_, _Swift_, _Objective-C_, _Kotlin_, _Perl_) etc.

<small>↑ precedence order</small>

* `( a, b, c )`
* `a.b`, `a[b]`, `a(b)`
* `a++`, `a--`
* `!a`, `+a`, `-a`, `++a`, `--a`
* `a * b`, `a / b`, `a % b`
* `a + b`, `a - b`
* `a << b`, `a >> b`, `a >>> b`
* `a < b`, `a <= b`, `a > b`, `a >= b`
* `a == b`, `a != b`
* `a & b`
* `a ^ b`
* `a | b`
* `a && b`
* `a || b`
* `a = += -= *= **= *= /= %= <<= >>= >>>= &= ^= |= &&= ||= b`
* `a , b`
* `"abc"`
* `0.1`, `1.2e+3`

```js
import subscript from 'subscript/subscript.js'

let xy = subscript('x + y');
xy({x: 1, y: 2});  // 3
```

## Justin

_Justin_ = _JSON_ + _Expressions_, a minimal JS subset. See original [thread](https://github.com/endojs/Jessie/issues/66)).<br/>

It extends _subscript_ with:

+ `**` exponentiation operator (right-assoc)
+ `~` bit inversion operator
+ `'` strings
+ `?:` ternary operator
+ `?.` optional chain operator
+ `[...]` Array literal
+ `{...}` Object literal
+ `in` binary
+ `;` expression separator
+ `//`, `/* */` comments
+ `true`, `false`, `null` literals
<!-- + `...x` unary operator -->
<!-- + strings interpolation -->

```js
import jstin from 'subscript/justin.js'

let xy = jstin('{ x: 1, "y": 2+2 }["x"]')
xy()  // 1
```

## Extending

_Subscript_ defines standard operator groups that can be plugged in:

Name | Syntax
---|---
`operators/core.js` | `a(b,c)`, `(a,(b,(c)))`
`operators/access.js` | `a.b`, `a[b]`
`operators/arithmetic.js` | `a+b`, `a-b`, `a/b`, `a*b`, `a%b`
`operators/bitwise.js` | `a|b`, `a&b`, `a^b`, `~a`
`operators/logical.js` | `a&&b`, `a||b`, `a??b`
`operators/assignment.js` | `a=b`, `a-=b`, `a+=b`, ...
`opeators/comparison.js` | `a==b`, `a!=b`, ...
`opeators/increment.js` | `a++`, `a--`, `--a`, `++a`
`opeators/ternary.js` |
`opeators/special.js` |

Custom operators/tokens can be defined via:

* `unary(str, precedence, postfix=false)` − register unary operator, either prefix or postfix.
* `binary(str, precedence, rightAssoc=false)` − register binary operator, optionally right-associative.
* `nary(str, precedence, allowSkip=false)` − register n-ary (sequence) operator, optionally allowing skipping args.
* `token(str, precedence, prevNode => curNode)` − register custom token or literal. Function takes last token and returns tree node.
* `operator(str, (a, b) => ctx => result)` − register evaluator for operator. Function takes node arguments and returns evaluator function.

```js
import script, { operator, unary, binary, token } from './subscript.js'

// add identity operators with precedence 9
binary('===', 9), binary('!==', 9)
operator('===', (a, b) => ctx => ctx[a]===ctx[b])
operator('!==', (a, b) => ctx => ctx[a]!==ctx[b])

// add boolean literals
token('true', 20, prev => ['',true])
token('false', 20, prev => ['',false])
operator('', boolNode => ctx => boolNode[1])

// add simple arrow functions
binary('=>', 2)
operator('=>',
  (a, b) => {
    a = a[0] === '(' ? a[1] : a
    const names = a == '' ? [] : // () =>
      a[0] === ',' ? a.slice(1) : // (a,c) =>
      [a] // a =>

    b = compile(b)

    return (ctx) => {
      const scope = Object.create(ctx)
      // evaluator
      return (...args) => (names.map((name, i) => scope[name] = args[i]), b(scope))
    }
  }
)
```

See [`/operators``](./operators) for examples of different operators.


## Parse / Compile

Subscript exposes `./src/parse.js` and `./src/compile.js` entries. <br/>
Parser builds AST, compiler converts it to evaluable function.

```js
// parse expression
let tree = parse('a.b + c')
tree // ['+', ['.', 'a', 'b'], 'c']

// compile tree to evaluable function
fn = compile(tree)
fn({a:{b:1}, c:2}) // 3
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

const fn = compile(['+', ['*', 'min', ['',60]], ['','sec']])

fn({min: 5}) // min*60 + "sec" == "300sec"
```

<!--
## Ideas

These are custom DSL operators snippets for your inspiration:


```html
template-parts proposal
<template id="timer">
  <time datetime="{{ date.toUTCString() }}">{{ date.toLocaleTimeString() }}</time>
</template>
```

// a.b.c
// (node, c) => c === PERIOD ? (index++, space(), ['.', node, '"'+id()+'"']) : node,

// a[b][c]
// (node, c) => c === OBRACK ? (index++, node=['.', node, expr(CBRACK)], index++, node) : node,

// a(b)(c)
// (node, c, arg) => c === OPAREN ? (
//   index++, arg=expr(CPAREN),
//   node = Array.isArray(arg) && arg[0]===',' ? (arg[0]=node, arg) : arg == null ? [node] : [node, arg],
//   index++, node
// ) : node,

<details>
  <summary>Keyed arrays <code>[a:1, b:2, c:3]</code></summary>

  ```js

  ```
</details>

<details>
  <summary>`7!` (factorial)</summary>

  ```js
  ```

</details>
<details>
  <summary>`5s`, `5rem` (units)</summary>

  ```js
  ```

</details>
<details>
  <summary>`?`, `?.`, `??`</summary>

  ```js
  ```

</details>
<details>
  <summary>`arrᵀ` - transpose,</summary>

  ```js
  ```

</details>
<details>
  <summary>`int 5` (typecast)</summary>

  ```js
  ```

</details>
<details>
  <summary>`$a` (param expansion)</summary>

  ```js
  ```

</details>
<details>
  <summary>`1 to 10 by 2`</summary>

  ```js
  ```

</details>
<details>
  <summary>`a if b else c`</summary>

  ```js
  ```

</details>
<details>
  <summary>`a, b in c`</summary>

  ```js
  ```

</details>
<details>
  <summary>`a.xyz` swizzles</summary>

  ```js
  ```

</details>
<details>
  <summary>vector operators</summary>

  ```js
  ```

</details>
<details>
  <summary>set operators</summary>

  ```js
  ```

</details>
<details>
  <summary>polynomial operators</summary>

  ```js
  ```

</details>

like versions, units, hashes, urls, regexes etc

2a as `2*a`

string interpolation ` ${} 1 ${} `

keyed arrays? [a:1, b:2, c:3]

Examples: sonr, template-parts, neural-chunks
-->

## Performance

Subscript shows good performance within other evaluators. Example expression:

```
1 + (a * b / c % d) - 2.0 + -3e-3 * +4.4e4 / f.g[0] - i.j(+k == 1)(0)
```

Parse 30k times:

```
es-module-lexer: 50ms 🥇
subscript: ~150 ms 🥈
justin: ~183 ms
jsep: ~270 ms 🥉
jexpr: ~297 ms
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
