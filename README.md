# <!--<img alt="subscript" src="/subscript2.svg" height=42/>--> sub͘<em>script</em> <!--<sub>SUB͘<em>SCRIPT</em></sub>-->

_Subscript_ is micro-language with common syntax subset of C++, JS, Java, Python, Go, Rust.<br/>

* Everyone knows _subscript_ syntax
* Any _subscript_ fragment can be copy-pasted to a target language and it will work
* It's tiny <sub>![npm bundle size](https://img.shields.io/bundlephobia/minzip/subscript/latest?color=brightgreen&label=gzip)</sub>
* Enables easy operators overloading
* Configurable & extensible
* Trivial to use...
<!-- * Performant? Not -->

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

It compiles code to lispy calltree (\~[frisk](https://npmjs.com/frisk)). Why?

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

parse(`'a' + 'b' // concat`) // ['+', "'a'", "'b'"]
```

## Operators

Default operators include common operators for the listed languages in the following precedence:

* `. ( [`
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
* `,`

All other operators can be extended.

```js
import {operators, parse, evaluate} from 'subscript.js'

// add operators to precedence groups
operators[0]['=>'] = (args, body) => evaluate(body, args)
operators[5]['|'] = (a,...b) => a.pipe(...b)

let tree = parse(`
  interval(350)
  | take(25)
  | map(gaussian)
  | map(num => "•".repeat(Math.floor(num * 65)))
`)
evaluate(tree, {Math, map, take, interval, gaussian})
```

Operators are defined in by precedence index. _0_ is reserved for groups, _1_ for unary operators.

```js
operators[1]['&'] = a=>address(a)   // unary prefix:  &a
operators[9]['U'] = (a,b)=>a.union(b)  // binary:  a U b
operators[9]['|'] = (...a)=>a[0].pipe(...)  // also binary: a | b
```

TODO: postfix unary operators are not yet supported.


## Transforms

Transform rules are applied to raw parsed operator groups, eg.:

* Flatten calls `a(b,c)(d)` → `['(', 'a', [',', 'b', 'c'], 'd']` → `[['a', 'b', 'c'], 'd']`
* Property access `a.b.c` → `['.', 'a', 'b', 'c']` → `['.', 'a', '"b"', '"c"']`

That can be used to organize ternary/combining operators:

```js
import {parse, transforms, operators} from 'subscript.js'

Object.assign(operators[11],{
  ':':(a,b)=>[a,b],
  '?':(a,b)=>a??b,
  '?:':(a,b)=>a?b:c
})
transforms[':'] = node => node[1][0]=='?' ? ['?:',node[1][1],node[1][2],node[2]] : node // [:, [?, a, b], c] → [?:, a, b, c]
parse('a ? b : c') // ['?:', 'a', 'b', 'c']

// bonus side-effect:
parse('a ? b') // ['?', 'a', 'b']
parse('a : b') // [':', 'a', 'b']
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

Parser is slower than anything else and needs optimization.

```
new Function: 321.511962890625 ms
justin: 562.35791015625 ms
expr-eval: 140.34423828125 ms
expression-eval: 87.680908203125 ms
jexl: 92.960205078125 ms
string-math: 106.323974609375 ms
```

## See also

* [Jessie](https://github.com/endojs/Jessie) − Minimal JS subset.
* [jexl](https://github.com/TomFrost/Jexl)
* [expr-eval](https://github.com/silentmatt/expr-eval)
* [expression-eval](https://github.com/donmccurdy/expression-eval)
* [jsep](https://github.com/EricSmekens/jsep)
* [string-math](https://github.com/devrafalko/string-math)


<p align=center>🕉</p>
