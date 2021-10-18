<!--# sanscript-->
<!-- Common root of all languages -->

# <!--<img alt="subscript" src="/subscript2.svg" height=42/>--> sub͘<em>script</em> <!--<sub>SUB͘<em>SCRIPT</em></sub>-->

Subscript is micro-language, common subset of C++, JS, Java, Python, Go, Rust, Perl.<br/>
* Anyone with knowledge of any of the languages automatically knows subscript.
* Any subscript fragment can be copy-pasted to the target language and will automatically work. (needs checking)

Alternatively, that's superset of JSON with operators, parens and functions. Variation of [Justin](https://github.com/endojs/Jessie/issues/66).

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

### It is 
* tiny <sub>![npm bundle size](https://img.shields.io/bundlephobia/minzip/subscript?color=brightgreen&label=gzip)</sub>
* extensible (any unary/binary operators/overloading)
* and seemingly trivial to use...

### Lispy tree

It compiles code to lispy tree (like [frisk](https://npmjs.com/frisk)). Why?

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

### JSON

It parses JSON objects out of box:

```js
import {parse} from 'subscript.js'
subscript('{x: 1, "y": 1+2}')  // {x:1, y: ['+', 1, 2]}
```

### Reserved operators

Some parts are non-configurable:

* `[` is reserved for arrays and property access
* `{` is reserved for objects
* `(` is reserved for calls or groups, cannot be redefined
* `.` is reserved for non-calculating property access
* `:` is reserved for key separator
* `,` is reserved for sequencing (doesn't create lisp groups)
* `"` is reserved for strings.
<!-- * `?:`, `|>`, `, in` ternary operators -->

### Overloadable operators

Default operators include common operators for the listed languages:<br/>
`! * / % - + << >> < <= > >= == != & ^ | && ||`.

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

### Support JSON

JSON objects are parsed as tokens. Keys are not necessarily strings:

```js
parse('{x:1, "y":2+2}') // {x:1, y: ['+', 2, 2]}
```

## Alternatives

* [jexl](https://github.com/TomFrost/Jexl)
* [expr-eval](https://github.com/silentmatt/expr-eval)
* [jsep](https://github.com/EricSmekens/jsep)
* [string-math](https://github.com/devrafalko/string-math)


<p align=center>🕉</p>
