<!--# sanscript-->
<!-- Common root of all languages -->

# <!--<img alt="subscript" src="/subscript2.svg" height=42/>-->sub͘<em>script</em> <!--<sub>SUB͘<em>SCRIPT</em></sub>-->
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

### Lispy tree

It compiles code to lispy tree (like [frisk](https://npmjs.com/frisk)). Why?

+ clear precedence
+ easy to overload/extend operators
+ mimic other langs/custom subsets
+ allows manual evaluation
+ conventional form.

```js
import {evaluate} from 'subscript.js'
evaluate(['+',1,['-',2, 3]]) // 0
```

### Default operators

It comes with common operators for the listed languages by default:<br/> `! * / % - + << >> < <= > >= == != & ^ | && || ,`
and extra `~ ** in`.
### Reserved operators

Some parts are non-configurable out of box:

* `[` is reserved for arrays and property access, but the operator `[` can be redefined
* `{` is reserved for objects, cannot be redefined
* `(` is reserved for fn calls or groups, cannot be redefined
* `.` is reserved for non-calculating property access
* `#` is prohibited as operator
* `?:` ternary operator

### Operator overloading

All other operators can be redefined.

```js
import {operators, parse} from 'subscript.js'

let ops = Object.assign({}, operators, {'|>': (a,b) => a.pipe(b)})
let tree = parse(`
  interval(350)
  |> take(25)
  |> map(gaussian)
  |> map(num => "•".repeat(Math.floor(num * 65)))
`, ops)
```

Operator precedence follows keys order in `ops` object, so you may need to provide desired order manually (see [sort-keys](https://www.npmjs.com/package/sort-keys) and alike).
Operators are binary by default, unary operators fall back to binary.
Ternary operators are impossible (for now).

### Support JSON

...

## Alternatives

* [jexl](https://github.com/TomFrost/Jexl)
* [expr-eval](https://github.com/silentmatt/expr-eval)
* [jsep](https://github.com/EricSmekens/jsep)
* [string-math](https://github.com/devrafalko/string-math)


<p align=center>🕉</p>
