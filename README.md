# <!--<img alt="subscript" src="/subscript2.svg" height=42/>--> sub͘<em>script</em> <!--<sub>SUB͘<em>SCRIPT</em></sub>-->

Subscript is micro-language, common subset of C++, JS, Java, Python, Go, Rust.<br/>

* Everyone knows _subscript_ syntax
* Any _subscript_ fragment can be copy-pasted to a target language and it will work
* It's tiny <sub>![npm bundle size](https://img.shields.io/bundlephobia/minzip/subscript?color=brightgreen&label=gzip)</sub>
* Enables easy operators overloading
* Configurable & extensible
* Performant?
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
+ easy to overload operators
+ easy to mimic other lang subsets
+ easy manual evaluation
+ easy debugging
+ conventional form
+ one-liner docs...

```js
import {evaluate} from 'subscript.js'
evaluate(['+', ['*', 'min', 60], '"sec"'], {min: 5}) // min*60 + "sec" == "300sec"
```

## Core primitives

* `[]`, `()` groups
* `true`, `false`, `null` literals
* `"` quotes.

All primitives are extensible via `literals`, `quotes`, `groups` dicts.

```js
import {quotes, parse} from 'subscript.js'
quotes["'"] = "'"
parse("'a' + 'b'") // ['+', "'a'", "'b'"]
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

Operator arity is detected from number of arguments:

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

<!--
### Justin

[Justin](https://github.com/endojs/Jessie/issues/66) is JSON with expressions extension.

+ ** operator
+ ~ operator
+ ?: ternary operator
+ [] Array literal
+ {} Object literal
+ in operator

```js
parse('{x:1, "y":2+2}['x']') // ['[', {x:1, y: ['+', 2, 2]}, 'x']
```
-->

<!--
### Ideas

These are some snippets for custom DSL operators:

* `7!` (factorial)
* `5s` (units),
* `exist?`
* `arrᵀ` - transpose,
* `int 5` (typecast)
* `$a` (param expansion)
* `1 to 10 by 2`
* `a if b else c`
* `a, b in c`
* `a.xyz` swizzles
* vector operators
* polynomial operators
* etc.

-->

<!--
### Performance

Compare against js eval, Function, quickjs, SES, jscan, alternatives from see-also
--->

## See also

* [Jessie](https://github.com/endojs/Jessie) − Minimal JS subset.
* [jexl](https://github.com/TomFrost/Jexl)
* [expr-eval](https://github.com/silentmatt/expr-eval)
* [jsep](https://github.com/EricSmekens/jsep)
* [string-math](https://github.com/devrafalko/string-math)


<p align=center>🕉</p>
