# <img alt="subscript" src="/subscript2.svg" height=42/> <!--sub͘<em>script</em>--> <!--<sub>SUB͘<em>SCRIPT</em></sub>--> 
<a href="https://github.com/spectjs/subscript/actions/workflows/node.js.yml"><img src="https://github.com/spectjs/subscript/actions/workflows/node.js.yml/badge.svg"/></a>
<a href="http://npmjs.org/subscript"><img src="https://img.shields.io/npm/v/subscript?color=indianred"/></a>
<a href="http://microjs.com/#subscript"><img src="https://img.shields.io/badge/microjs-subscript-blue?color=darkslateblue"/></a>

_Subscript_ is micro-language with common syntax subset of C++, JS, Java, Python, Go, Rust, Swift, Objective C, Kotlin etc.<br/>

* Well-known syntax
* Any _subscript_ fragment can be copy-pasted to any target language
* It's tiny <sub><a href="https://bundlephobia.com/package/subscript@6.0.0"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/subscript/latest?color=brightgreen&label=gzip"/></a></sub>
* It's :rocket: fast ([see performance](#performance))
* Configurable & extensible
* Trivial to use...

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

[_Jsep_](https://github.com/EricSmekens/jsep) is generally fine for the listed tasks, unless you need dependencies as small as possible.
_Subscript_ has [1.8kb](https://npmfs.com/package/subscript/6.0.0/subscript.min.js) footprint vs [11.4kb](https://npmfs.com/package/jsep/1.2.0/dist/jsep.min.js) _jsep_ + [4.5kb](https://npmfs.com/package/expression-eval/5.0.0/dist/expression-eval.module.js) _expression-eval_, with _jsep_ test coverage and better performance.


## Design

### Operators

Default operators include common operators for the listed languages in the following precedence:

* `++ --` unary postfix
* `! + - ++ --` unary prefix
* `* / %`
* `+ -`
* `<< >> >>>`
* `< <= > >=`
* `== !=`
* `&`
* `^`
* `|`
* `&&`
* `||`

Operators can be extended via `operator(char, precedence, reducer)` for unary/binary/postfix operators (detected by number of arguments in reducer).


```js
import script from 'subscript.js'

script.operator('=>', 10, ( args, body ) => evaluate(body, args))
script.operator('|', 10, ( a, b ) => a.pipe(b))

let tree = parse(`
  interval(350)
  | take(25)
  | map(gaussian)
  | map(num => "•".repeat(Math.floor(num * 65)))
`)
evaluate(tree, { Math, map, take, interval, gaussian })
```

### Literals

Default literals include:

* `"abc"` strings
* `1.2e+3` numbers

Literals are extensible by providing custom parser to `lookup`, can be added support of _booleans_, function calls, prop chains, groups, _regexes_, _strings_, _numbers_ and any other constructs.

```js
import script from 'subscript.js'

script.literal.unshift(c => skip('this') && {x:1})
script`this.x`() // 1
```

### Identifiers

Identifiers include

### Spaces/comments

Comments can be added via extending `parse.space`. See [justin.js](./justin.js) for more examples.


## Justin

_Justin_ extension (original [thread](https://github.com/endojs/Jessie/issues/66)) is minimal JS subset − JSON with JS expressions.<br/>
It adds support of:

+ `===`, `!==` operators
+ `**` binary operator
+ `~` unary operator
+ `'` strings
+ `?:` ternary operator
+ `[...]` Array literal
+ `{...}` Object literal
+ `in` binary operator
+ `;` expression separator
+ unary word operators
+ `//`, `/* */` comments
+ `true`, `false`, `null`, `undefined` literals
<!-- + `?` chaining operator -->
<!-- + `...x` unary operator -->
<!-- + strings interpolation -->

```js
import { parse, evaluate } from 'subscript/justin.js'

let xy = parse('{ x: 1, "y": 2+2 }["x"]') // ['[', {x:1, y: ['+', 2, 2]}, '@x']
evaluate(xy)  // 1
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
jsep: ~260 ms
expr-eval: ~480 ms
jexl: ~1200 ms
new Function: ~1400 ms
```

Eval 30k times:
```
subscript: ~17 ms
jsep: ~33 ms
expr-eval: ~72 ms
jexl: ~100 ms
new Function: ~7 ms
```

## Competitors

* [Jessie](https://github.com/endojs/Jessie) − Minimal JS subset.
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

<p align=center>🕉</p>
