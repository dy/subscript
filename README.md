# <!--<img alt="subscript" src="/subscript2.svg" height=42/>--> sub͘<em>script</em> <!--<sub>SUB͘<em>SCRIPT</em></sub>-->

_Subscript_ is micro-language with common syntax subset of C++, JS, Java, Python, Go, Rust.<br/>

* It has well-known syntax
* Any _subscript_ fragment can be copy-pasted to any target language
* It's tiny <sub>![npm bundle size](https://img.shields.io/bundlephobia/minzip/subscript/latest?color=brightgreen&label=gzip)</sub>
* It's very fast ([see performance](#performance))
* Configurable & extensible
* Trivial to use...

```js
import subscript from 'subscript.js'
let fn = subscript(`a.b + c(d - 1)`)
fn({ a: { b:1 }, c: x => x * 2, d: 3 }) // 5
```

## Motivation

_Subscript_ is designed to be useful for:

* templates (perfect match with [template parts](https://github.com/github/template-parts))
* expressions evaluators, calculators
* subsets of languages (eg. [justin](#justin)) <!-- see sonr, mineural -->
* mocking language features (eg. pipe operator)
* sandboxes, playgrounds, safe eval
* custom DSL

[_Jsep_](https://github.com/EricSmekens/jsep) is generally fine for the listed tasks, unless you design a tiny module and prefer to keep dependencies as small as possible.
_Subscript_ has [2.5kb](https://npmfs.com/package/subscript/3.0.0/subscript.min.js) footprint vs [11.4kb](https://npmfs.com/package/jsep/1.2.0/dist/jsep.min.js) _jsep_, with same or better performance. It also has more open API and generates lispy calltree (compatible with [frisk](https://npmjs.com/frisk)), compared to esprima AST: minimal possible overhead, clear precedence, overloading by context, manual evaluation, debugging, conventional form, one-liner docs:

```js
import {evaluate} from 'subscript.js'

evaluate(['+', ['*', 'min', 60], '"sec"'], { min: 5 }) // min*60 + "sec" == "300sec"
``` 


## Operators

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

All other operators can be extended via `parse.binary`, `parse.unary` and `evaluate.operator`.

```js
import { parse, evaluate } from 'subscript.js'

// add precedences
parse.binary['=>'] = 10

// define evaluators
evaluate.operator['=>'] = ( args, body ) => evaluate(body, args)
evaluate.operator['|'] = ( a, ...b ) => a.pipe(...b)

let tree = parse(`
  interval(350)
  | take(25)
  | map(gaussian)
  | map(num => "•".repeat(Math.floor(num * 65)))
`)
evaluate(tree, { Math, map, take, interval, gaussian })
```

## Extending

By default subscript detects the following tokens:

* `"` strings
* `1.2e+3` floats
* `true`, `false`, `null` literals
* `()` expression groups or fn calls
* `.`, `[]` property access

Literals can be extended via `parse.literal` dict.

Token parsers are extensible via `parse.token` list, can be added support of _regex_, _array_, _object_, _interpolated string_ and others.

Postfix parsers are applied to parsed tokens and can be used to provide _property chains_, _function calls_, _postfix operators_, _token mapping_, _ternary operators_ and so on. They're extensible via `parse.postfix`.


## Justin

_Justin_ extension (original [thread](https://github.com/endojs/Jessie/issues/66)) is minimal JS subset − JSON with JS expressions.<br/>
It adds support for:

+ `**` binary operator
+ `~` unary operator
+ `'` strings
+ `?:` ternary operator
+ `[...]` Array literal
+ `{...}` Object literal
+ `in` binary operator
+ `;` expression separator
<!-- + `//, /* */` comments -->
<!-- + `undefined` literal -->
<!-- + `?` chaining operator -->
<!-- + `...x` unary operator -->
<!-- + strings interpolation -->

```js
import { parse, evaluate } from 'subscript/justin.js'

let xy = parse('{ x: 1, "y": 2+2 }["x"]') // ['[', {x:1, y: ['+', 2, 2]}, '"x"']
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
// 1 + (a * b / c % d) - 2.0 + -3e-3 * +4.4e4 / f.g[0] - i.j(+k == 1)(0)
// parse 30k times

subscript: ~280 ms
jsep: ~280 ms
expr-eval: ~480 ms
jexl: ~1200 ms
new Function: ~1400 ms
```

## See also

* [Jessie](https://github.com/endojs/Jessie) − Minimal JS subset.
* [jexl](https://github.com/TomFrost/Jexl)
* [mozjexl](https://github.com/mozilla/mozjexl)
* [expr-eval](https://github.com/silentmatt/expr-eval)
* [expression-eval](https://github.com/donmccurdy/expression-eval)
* [jsep](https://github.com/EricSmekens/jsep)
* [string-math](https://github.com/devrafalko/string-math)


<p align=center>🕉</p>
