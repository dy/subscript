# subscript

Subscript is micro-language, common subset of C++, JS, Java, Python, Go, Rust, Perl.
In other words that's superset of JSON with operators, parens and functions (see [justin](https://github.com/endojs/Jessie/issues/66)).

Converts expression to lispy tree:
+ clear precedence;
+ easy overload/extension of operators;
+ extend to other langs;
+ allows manual evaluation;
+ conventional form.

Just call it with passing env:

```js
import subscript from './lib/subscript.js'
let evaluate = subscript(`a + (b - c)`)
evaluate({a:1, b:2, c:3}) // 0
```

It can be used in:
* templates (awesome match with [template parts](https://github.com/github/template-parts))
* scoped languages / subsets
* various expressions evaluators (math, arithmetic)
* simple playgrounds
* custom DSL

It is tiny (800bytes), extensible (any unary/binary operators/overloading), and hopefully trivial to use...

It can unfortunately be relatively slow on parsing, compared to LR parsing. If you have desire to implement efficient parsing scheme, like [htm](https://ghub.io/htm) - you're welcome to fork.

Or just check out alternatives:

* [jexl](https://github.com/TomFrost/Jexl)
* [expr-eval](https://github.com/silentmatt/expr-eval)
* [jsep](https://github.com/EricSmekens/jsep)
* [string-math](https://github.com/devrafalko/string-math)

## Lispy tree

It reminds [frisk](https://npmjs.com/frisk):

```js
import {evaluate} from 'subscript.js'
evaluate(['+',1,['-',2, 3]]) // 0
```

## Support JSONs

...

## Operator overloading

```js
import {operators, parse} from 'subscript.js'

operators['|>'] = (a,b) => a.pipe(b)
let evaluate = parse`
  interval(350)
  |> take(25)
  |> map(gaussian),
  |> map(num => "•".repeat(Math.floor(num * 65)))
`
evaluate(env)
```

<p align=center>🕉 Hare Krishna</p>
