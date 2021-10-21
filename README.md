<!--# sanscript-->
<!-- Common root of all languages -->

# <!--<img alt="subscript" src="/subscript2.svg" height=42/>--> <sub>sub͘</sub><em>script</em> <!--<sub>SUB͘<em>SCRIPT</em></sub>-->

Subscript is micro-language, common subset of C++, JS, Java, Python, Go, Rust.<br/>

* Anyone with knowledge of any of the languages automatically knows _<sub>sub</sub>script_.
* Any _<sub>sub</sub>script_ fragment can be copy-pasted to a target language and it will work.
* It's tiny <sub>![npm bundle size](https://img.shields.io/bundlephobia/minzip/subscript?color=brightgreen&label=gzip)</sub>
* It's extensible (any unary/binary operators overloading)
* And seemingly trivial to use...

```js
import subscript from 'subscript.js'
let evaluate = subscript(`a + (b - c)`)
evaluate({a:1, b:2, c:3}) // 0
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

Default operators include common operators for the listed languages:<br/>
`! . ( * / % - + << >> < <= > >= == != & ^ | && || ,`.

Extra operators like `~ ** in` can be included separately, but make code less compatible.

All other operators can be redefined.

```js
import {operators, parse, evaluate} from 'subscript.js'

let ops = Object.assign({}, operators, {'|>': (a,b) => a.pipe(b), '=>': (args,fn) => /*eval fn with args*/ })
let tree = parse(`
  interval(350)
  |> take(25)
  |> map(gaussian)
  |> map(num => "•".repeat(Math.floor(num * 65)))
`, ops)
```

Operator precedence follows keys order in `ops` object, so you may need to provide desired order manually.
Operators are binary by default, unary operators fall back to binary as follows: `a*-+-b` → `a*(-(+(-b)))`.
Ternary operators are impossible (for now).

<!--
### Support JSON

JSON objects are parsed as tokens. Keys are not necessarily strings:

```js
parse('{x:1, "y":2+2}') // {x:1, y: ['+', 2, 2]}
```
-->

## See also

* [Justin](https://github.com/endojs/Jessie/issues/66) − JSON with operators.
* [Jessie]() − Minimal JS subset.

## Alternatives

* [jexl](https://github.com/TomFrost/Jexl)
* [expr-eval](https://github.com/silentmatt/expr-eval)
* [jsep](https://github.com/EricSmekens/jsep)
* [string-math](https://github.com/devrafalko/string-math)


<p align=center>🕉</p>
