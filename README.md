# sub͘<em>script</em> <!--<sub>SUB͘<em>SCRIPT</em></sub>-->

Subscript is micro-language, common subset of C++, JS, Java, Python, Go, Rust, Perl.<br/>
Alternatively, that's superset of JSON with operators, parens and functions. Variation of [Justin](https://github.com/endojs/Jessie/issues/66).

```js
import subscript from 'subscript.js'
let evaluate = subscript(`a + (b - c)`)
evaluate({a:1, b:2, c:3}) // 0
```

### Useful in
* templates (awesome match with [template parts](https://github.com/github/template-parts))
* scoped languages / subsets
* expressions evaluators (math, arithmetic)
* playgrounds
* custom DSL

### It is 
* tiny <sub>![npm bundle size](https://img.shields.io/bundlephobia/minzip/subscript?color=brightgreen&label=gzip)</sub>
* extensible (any unary/binary operators/overloading)
* and seemingly trivial to use...

It can possibly be slow at parsing, compared to efficient LR algos (needs benchmarking). But better something than nothing.<br/>
If you have desire to implement efficient parsing scheme, like [htm](https://ghub.io/htm) - you're welcome to contribute or fork.

### Lispy tree

It compiles code to lispy tree (see [frisk](https://npmjs.com/frisk)). Why?

+ clear precedence
+ easy to overload/extend operators
+ mimic custom other langs subsets
+ allows manual evaluation
+ conventional form.

```js
import {evaluate} from 'subscript.js'
evaluate(['+',1,['-',2, 3]]) // 0
```

### Default operators

By default it comes with common operators for the listed languages:<br/> `! . * / % - + << >> < <= > >= == != & ^ | && || ,` and extra `~ ** in`
.
<!--
Op | Meaning
---|---
`!` | Negate
`~` | Inverse
`.` | Property
`**` | Power
`*` | Multiply
`/` | Divide
`%` | Module
`-` | Subtract
`+` | Add
`<<` | Left shift
`>>` | Right shift
`<` | Less
`<=` | Less or equal
`>` | Greater
`>=` | Greater or equal
`in` | 
`==` | Equal
`!=` | Not equal
`&` | Binary and
`^` | Binary xor
`|` | Binary or
`&&` | And
`||` | Or
`,` | Sequence
-->

### Operator overloading

Simply extend `operators` dict:

```js
import {operators, parse} from 'subscript.js'

operators = Object.assign(operators, {'|>': (a,b) => a.pipe(b)})
let evaluate = parse(`
  interval(350)
  |> take(25)
  |> map(gaussian)
  |> map(num => "•".repeat(Math.floor(num * 65)))
`, operators)
evaluate(env)
```

Operator precedence follows keys order in `operators` object, so you may need to provide desired order manually.

### Support JSON

...

## Alternatives

* [jexl](https://github.com/TomFrost/Jexl)
* [expr-eval](https://github.com/silentmatt/expr-eval)
* [jsep](https://github.com/EricSmekens/jsep)
* [string-math](https://github.com/devrafalko/string-math)


<p align=center>🕉</p>
