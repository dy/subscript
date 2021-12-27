# <img alt="subscript" src="/subscript2.svg" height=42/> <!--sub͘<em>script</em>--> <!--<sub>SUB͘<em>SCRIPT</em></sub>--> 
<a href="https://github.com/spectjs/subscript/actions/workflows/node.js.yml"><img src="https://github.com/spectjs/subscript/actions/workflows/node.js.yml/badge.svg"/></a>
<a href="http://npmjs.org/subscript"><img src="https://img.shields.io/npm/v/subscript?color=indianred"/></a>
<a href="http://microjs.com/#subscript"><img src="https://img.shields.io/badge/microjs-subscript-blue?color=darkslateblue"/></a>

_Subscript_ is micro-language with common syntax subset of C++, JS, Java, Python, Go, Rust etc.<br/>

* Standard conventional syntax
* Any fragment can be copy-pasted to any target language
* Tiny size <sub><a href="https://bundlephobia.com/package/subscript@6.0.0"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/subscript/latest?color=brightgreen&label=gzip"/></a></sub>
* :rocket: fast ([performance](#performance))
* Configurable & extensible
* Trivial to use

```js
import script from 'subscript.js'
let fn = script`a.b + c(d - 1)`
fn({ a: { b:1 }, c: x => x * 2, d: 3 }) // 5
```

## Motivation

_Subscript_ is designed to be useful for:

* templates (perfect match with [template parts](https://github.com/github/template-parts))
* expressions evaluators, calculators
* configurable subsets of languages (eg. [justin](#justin)) <!-- see sonr, mineural -->
* pluggable/mock language features (eg. pipe operator)
* sandboxes, playgrounds, safe eval
* custom DSL

_Subscript_ has [2kb](https://npmfs.com/package/subscript/6.0.0/subscript.min.js) footprint, compared to [11.4kb](https://npmfs.com/package/jsep/1.2.0/dist/jsep.min.js) _jsep_ + [4.5kb](https://npmfs.com/package/expression-eval/5.0.0/dist/expression-eval.module.js) _expression-eval_, with better test coverage and better performance.


## Design

Default operators (same as JS precedence order):

* `( a, b, c )`
* `a . b`, `a [ b ]`, `a ( b, c )`
* `a++`, `a--` unary postfix
* `!a`, `+a`, `-a`, `++a`, `--a` unary prefix
* `a * b`, `a / b`, `a % b`
* `a + b`, `a - b`
* `a << b`, `a  >>b`, `a  >>>b`
* `a < b`, `a <= b`, `a  >b`, `a  >=b`
* `a == b`, `a != b`
* `a & b`
* `a ^ b`
* `a | b`
* `a && b`
* `a || b`

Default literals:

* `"abc"` strings
* `1.2e+3` numbers

Everything else can be extended via `parse.set(operator, precedence, fn)` for unary or binary operators (detected by number of arguments in `fn`), or via `parse.set(operator, parser, precedence)` for custom tokens.

See [subscript.js](subscript.js) or [justin.js](./justin.js) for examples.

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
subscript: ~170 ms
justin: ~183 ms
jsep: ~250 ms
mr-parser: ~420 ms
expr-eval: ~480 ms
math-parser: ~570 ms
jexl: ~1056 ms
mathjs: ~1200 ms
new Function: ~1154 ms
```

Eval 30k times:
```
subscript: ~15 ms
justin: ~15 ms
jsep (expression-eval): ~30 ms
mr-parser: -
expr-eval: ~72 ms
math-parser: -
jexl: ~110 ms
mathjs: ~119 ms
new Function: ~5 ms
```

## Alternatives

* [jexl](https://github.com/TomFrost/Jexl)
* [mozjexl](https://github.com/mozilla/mozjexl)
* [expr-eval](https://github.com/silentmatt/expr-eval)
* [expression-eval](https://github.com/donmccurdy/expression-eval)
* [jsep](https://github.com/EricSmekens/jsep)
* [string-math](https://github.com/devrafalko/string-math)
* [nerdamer](https://github.com/jiggzson/nerdamer)
* [math-codegen](https://github.com/mauriciopoppe/math-codegen)
* [math-parser](https://www.npmjs.com/package/math-parser)
* [math.js](https://mathjs.org/docs/expressions/parsing.html)
* [Jessie](https://github.com/endojs/Jessie)

<p align=center>🕉</p>
