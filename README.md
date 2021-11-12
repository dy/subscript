# <!--<img alt="subscript" src="/subscript2.svg" height=42/>--> sub͘<em>script</em> <!--<sub>SUB͘<em>SCRIPT</em></sub>-->

_Subscript_ is micro-language with common syntax subset of C++, JS, Java, Python, Go, Rust.<br/>

* Everyone knows _subscript_ syntax
* Any _subscript_ fragment can be copy-pasted to a target language and it will work
* It's tiny <sub>![npm bundle size](https://img.shields.io/bundlephobia/minzip/subscript/latest?color=brightgreen&label=gzip)</sub>
* It's very fast ([see performance](#performance))
* Enables operators overloading
* Configurable & extensible
* Trivial to use...

```js
import subscript from 'subscript.js'
let fn = subscript(`a.b + c(d - 1)`)
fn({a:{b:1}, c:x=>x*2, d:3}) // 5
```

## Useful in:

* templates (awesome match with [template parts](https://github.com/github/template-parts))
* expressions evaluators (math, arithmetic)
* subsets of languages (eg. jessie, justin) <!-- see sonr -->
* prototyping language features (eg. pipe operator)
* simulating languages (eg. glsl <!--, FORTRAN?, COBOL?-->)
* sandboxes, playgrounds
* safe, secure eval
* custom DSL

```html
<!-- template-parts proposal -->
<template id="timer">
  <time datetime="{{ date.toUTCString() }}">{{ date.toLocaleTimeString() }}</time>
</template>
```

## Lispy tree

It compiles code to lispy calltree (compatible with [frisk](https://npmjs.com/frisk)). Why?

+ minimal possible AST overhead
+ clear operators precedence
+ overloading operators by context 
+ simple manual evaluation, debugging
+ conventional form
+ one-liner docs...

```js
import {evaluate} from 'subscript.js'
evaluate(['+', ['*', 'min', 60], '"sec"'], {min: 5}) // min*60 + "sec" == "300sec"
```

## Core primitives

By default subscript reserves:

* `[]`, `()` groups
* `true`, `false`, `null` literals
* `"` quotes.

All primitives are extensible via `literals`, `quotes`, `groups`, `comments` dicts.

```js
import {quotes, comments, parse} from 'subscript.js'

quotes["'"] = "'"
comments["//"] = "\n"

parse(`'a' + 'b' // concat`) // ['+', 'a':String, 'b':String]
```

## Operators

Default operators include common operators for the listed languages in the following precedence:

* `.`
* `! + - ++ --` unary
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

All other operators can be extended via `binary`, `unary` and `operators`.

```js
import {binary, operators, parse, evaluate} from 'subscript.js'

// add precedences
binary['=>'] = 10

// define evaluators
operators['=>'] = (args, body) => evaluate(body, args)
operators['|'] = (a,...b) => a.pipe(...b)

let tree = parse(`
  interval(350)
  | take(25)
  | map(gaussian)
  | map(num => "•".repeat(Math.floor(num * 65)))
`)
evaluate(tree, {Math, map, take, interval, gaussian})
```

## Transforms

Transform rules are applied to raw parsed calltree groups, eg.:

* Flatten calls `a(b,c)(d)` → `['(', 'a', [',', 'b', 'c'], 'd']` → `[['a', 'b', 'c'], 'd']`
* Property access `a.b.c` → `['.', 'a', 'b', 'c']` → `['.', 'a', '"b"', '"c"']`

That can be used to organize ternary/combining operators:

```js
import {parse, binary, transforms, operators} from 'subscript.js'

operators['?:'] = (a,b)=>a?b:c
binary[':'] = binary['?'] = 5
transforms[':'] = node => node[1][0]=='?' ? ['?:',node[1][1],node[1][2],node[2]] : node // [:, [?, a, b], c] → [?:, a, b, c]

parse('a ? b : c') // ['?:', 'a', 'b', 'c']
```


## Justin

_Justin_ extension (original [thread](https://github.com/endojs/Jessie/issues/66)) is minimal JS subset − JSON with JS expressions.<br/>
It adds support for:

+ `**` binary operator
+ `~` unary operator
+ `?:` ternary operator
+ `[...]` Array literal
+ `{...}` Object literal
+ `in` binary operator
+ `;` expression separator
+ `//, /* */` comments
+ `undefined` literal
<!-- + `...x` unary operator -->
<!-- + strings interpolation -->

```js
import {parse} from 'subscript/justin.js'

let tree = parse('{x:1, "y":2+2}["x"]') // ['[', {x:1, y: ['+', 2, 2]}, '"x"']
```

<!--
## Ideas

These are custom DSL operators snippets for your inspiration:

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
-->

## Performance

Subscript shows relatively good performance within other evaluators:

```
// parse/evaluate `(a + 2) * 3 / 2 + b * 2 - ${c}` 30k times

subscript: 128.77783203125 ms
jsep: 141.91796875 ms
jexl: 347.718994140625 ms
string-math: 494.740966796875 ms
new Function: 3173.48095703125 ms
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
