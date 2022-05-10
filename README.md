# <img alt="subscript" src="/subscript2.svg" height=28/> <!--sub͘<em>script</em>--> <!--<sub>SUB͘<em>SCRIPT</em></sub>--> <a href="https://github.com/spectjs/subscript/actions/workflows/node.js.yml"><img src="https://github.com/spectjs/subscript/actions/workflows/node.js.yml/badge.svg"/></a> <a href="http://npmjs.org/subscript"><img src="https://img.shields.io/npm/v/subscript"/></a> <a href="http://microjs.com/#subscript"><img src="https://img.shields.io/badge/microjs-subscript-blue?color=darkslateblue"/></a>

_Subscript_ is expression evaluator / microlanguage with [common syntax](https://en.wikipedia.org/wiki/Comparison_of_programming_languages_(syntax)).<br/>

* Tiny size <sub><a href="https://bundlephobia.com/package/subscript@6.0.0"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/subscript/latest?color=brightgreen&label=gzip"/></a></sub>
* :rocket: Fast [performance](#performance)
* Configurable & extensible
* Trivial to use

```js
import script, { parse, compile } from './subscript.js'

// create expression evaluator
let fn = script('a.b + c(d - 1)')
fn({ a: { b:1 }, c: x => x * 2, d: 3 }) // 5

// or
// parse expression
let tree = parse('a.b + c')
tree // ['+', ['.', 'a', 'b'], 'c']

// compile tree to evaluable function
let evaluate = compile(tree)
```

## Motivation

_Subscript_ is designed to be useful for:

* templates (perfect match with [template parts](https://github.com/github/template-parts), see [templize](https://github.com/spectjs/templize))
* expressions evaluators, calculators
* configurable subsets of languages (eg. [justin](#justin))
* pluggable/mock language features (eg. pipe operator)
* sandboxes, playgrounds, safe eval
* custom DSL <!-- see sonr, mineural -->

_Subscript_ has [2.8kb](https://npmfs.com/package/subscript/7.0.0/subscript.min.js) footprint, compared to [11.4kb](https://npmfs.com/package/jsep/1.2.0/dist/jsep.min.js) _jsep_ + [4.5kb](https://npmfs.com/package/expression-eval/5.0.0/dist/expression-eval.module.js) _expression-eval_, with better test coverage and better performance.


## Design

Default operators are (same as JS precedence order):

* `( a, b, c )`
* `a.b`, `a[b]`, `a(b, c)`
* `a++`, `a--` unary postfix
* `!a`, `+a`, `-a`, `++a`, `--a` unary prefix
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
* `a , b`

Default literals:

* `"abc"` strings
* `1.2e+3` numbers

## Extending

Operators/tokens can be extended via:

* `unary(str, prec, postfix=false)` − register unary operator, either prefix or postfix.
* `binary(str, prec, rightAssoc=false)` − register binary operator, optionally right-associative.
* `nary(str, prec, allowSkip=false)` − register n-ary (sequence) operator, optionally allowing skipping args.
* `token(str, prec, fn)` − register custom token or literal. `fn` takes last token as argument and returns calltree node.
* `operator(str, fn)` − register evaluator for operator. `fn` takes node arguments and returns evaluator function.

```js
import script, { operator, unary, binary, token } from './subscript.js'

// add ~ unary operator with precedence 15
unary('~', 15)
operator('~', a => ~a)

// add === binary operator with precedence 9
binary('===', 9)
operator('===', (a, b) => a===b)

// add literals
token('true', 20, a => ['',true])
token('false', 20, a => ['',false])
operator('', a => ctx => a[1]])
```

See [subscript.js](subscript.js) or [justin.js](./justin.js) for examples.


## Syntax tree

Subscript exposes separate `./parse.js` and `./compile.js` entries. Parser builds AST, compiler converts it to evaluable function.

AST has simplified lispy calltree structure (inspired by [frisk](https://ghub.io/frisk)), opposed to [ESTree](https://github.com/estree/estree):

* is not limited to particular language, can be cross-compiled;
* reflects execution sequence, rather than code layout;
* has minimal possible overhead, directly maps to operators;
* simplifies manual evaluation and debugging;
* has conventional form and one-liner docs:

```js
import { compile } from 'subscript.js'

const fn = compile(['+', ['*', 'min', ['',60]], ['','sec']])

fn({min: 5}) // min*60 + "sec" == "300sec"
```

<!--
Operators can be extended via .

```js
import script from 'subscript.js'

script.set('|', 10, ( a, b ) => a.pipe(b))

let evaluate = script(`
  interval(350)
  | take(25)
  | map(gaussian)
  | "•".repeat(Math.floor(it * 65)))
`)
evaluate({ Math, map, take, interval, gaussian })
```

Literals are extensible by providing custom parser to `lookup`, can be added support of _booleans_, function calls, prop chains, groups, _regexes_, _strings_, _numbers_ and any other constructs.

```js
import script from 'subscript.js'

script.literal.unshift(c => skip('this') && {x:1})
script`this.x`() // 1
```

### Identifiers

Identifiers include

### Spaces/comments

Comments can be added via extending `parse.space`.
-->

## Justin

_Justin_ is minimal JS subset − JSON with JS expressions (see original [thread](https://github.com/endojs/Jessie/issues/66)).<br/>

It extends _subscript_ with:

+ `===`, `!==` operators
+ `**` exponentiation operator (right-assoc)
+ `~` bit inversion operator
+ `'` strings
+ `?:` ternary operator
+ `?.` optional chain operator
+ `??` nullish coalesce operator
+ `[...]` Array literal
+ `{...}` Object literal
+ `in` binary
+ `;` expression separator
+ `//`, `/* */` comments
+ `true`, `false`, `null`, `undefined` literals
<!-- + `...x` unary operator -->
<!-- + strings interpolation -->

```js
import jstin from 'subscript/justin.js'

let xy = jstin('{ x: 1, "y": 2+2 }["x"]')
xy()  // 1
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

Subscript shows relatively good performance within other evaluators:

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

## JS engines

* [engine262](https://github.com/engine262/engine262)
* [Jessie](https://github.com/endojs/Jessie)
* [xst](https://github.com/Moddable-OpenSource/moddable-xst)

<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
