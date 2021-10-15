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

It is tiny (800bytes), extensible and ...

It can unfortunately be relatively slow on parsing. If you have desire to organize efficient lr parsing scheme, like [htm](https://ghub.io/htm) - you're welcome to fork.

<p align=center>🕉 Hare Krishna</p>
