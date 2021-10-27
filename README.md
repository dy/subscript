<!--# sanscript-->
<!-- Common root of all languages -->

# <!--<img alt="subscript" src="/subscript2.svg" height=42/>--> sub͘<em>script</em> <!--<sub>SUB͘<em>SCRIPT</em></sub>-->

Subscript is micro-language, common subset of C++, JS, Java, Python, Go, Rust.<br/>
<!-- Part-time it's also [Justin](https://github.com/endojs/Jessie/issues/66) (JSON with expressions). -->

* Everyone already knows _subscript_.
* Any _subscript_ fragment can be copy-pasted to a target language and it will work.
* It's tiny <sub>![npm bundle size](https://img.shields.io/bundlephobia/minzip/subscript?color=brightgreen&label=gzip)</sub>
* It's extensible and allows operators overloading.
* Trivial to use...

```js
import subscript from 'subscript.js'
let fn = subscript(`a + (b - c)`)
fn({a:1, b:2, c:3}) // 0
```

### Useful in

* templates (awesome match with [template parts](https://github.com/github/template-parts))
* expressions evaluators (math, arithmetic)
* scoped languages / subsets <!-- see sonr -->
* prototyping language features
* playgrounds
* custom DSL

### Lispy tree

It compiles code to lispy calltree (like [frisk](https://npmjs.com/frisk)). Why?

+ no operators precedence issue
+ easy to overload/extend operators
+ easy to mimic other lang subsets
+ easy manual evaluation
+ easy debugging
+ conventional form.

```js
import {evaluate} from 'subscript.js'
evaluate(['+',1,['*',2, 3]]) // 0
```


### Reserved operators

Some parts are non-configurable:

* `[` is reserved for property access
* `(` is reserved for calls or groups
* `.` is reserved for non-calculating property access
* `,` is reserved for sequencing (doesn't create groups)
* `"` is reserved for strings.
<!-- * `:` is reserved for key separator -->
<!-- * `?:`, `|>`, `, in` ternary operators -->

### Overloadable operators

Default operators include common operators for the listed languages in the following precedence:

* `. (`
* `!`, (`~ + - ++ --` − Justin)
* (`**` − Justin)
* `* / %`
* `+ -`
* `<< >> >>>`
* `< <= > >=`, (`in` − Justin)
* `== !=`
* `&`
* `^`
* `|`
* `&&`
* `||`
* `,`

All other operators can be redefined.

```js
import {operators, parse, evaluate} from 'subscript.js'

// add operators to precedence groups
operators[5]['|>'] = (a,...b) => a.pipe(...b)
operators.unshift({'=>': (args,body) => evaluate(body, args) })

let tree = parse(`
  interval(350)
  |> take(25)
  |> map(gaussian)
  |> map(num => "•".repeat(Math.floor(num * 65)))
`, ops)
```

<!-- Ternary operators are impossible (for now). -->

<!--
### Support JSON

JSON objects are parsed as tokens. Keys are not necessarily strings:

```js
parse('{x:1, "y":2+2}') // {x:1, y: ['+', 2, 2]}
```
-->

## See also

* [Jessie](https://github.com/endojs/Jessie) − Minimal JS subset.
* [jexl](https://github.com/TomFrost/Jexl)
* [expr-eval](https://github.com/silentmatt/expr-eval)
* [jsep](https://github.com/EricSmekens/jsep)
* [string-math](https://github.com/devrafalko/string-math)


<p align=center>🕉</p>
