# <!--<img alt="subscript" src="/subscript2.svg" height=42/>--> sub͘<em>script</em> <!--<sub>SUB͘<em>SCRIPT</em></sub>-->

Subscript is micro-language, common subset of C++, JS, Java, Python, Go, Rust.<br/>

* You already know _subscript_
* Any _subscript_ fragment can be copy-pasted to a target language and it will work
* It's tiny <sub>![npm bundle size](https://img.shields.io/bundlephobia/minzip/subscript?color=brightgreen&label=gzip)</sub>
* Enables easy operators overloading
* Highly extensible
* Performant?
* Trivial to use...

```js
import subscript from 'subscript.js'
let fn = subscript(`a + (b - c)`)
fn({a:1, b:2, c:3}) // 0
```

### Useful in

* templates (awesome match with [template parts](https://github.com/github/template-parts))
* expressions evaluators (math, arithmetic)
* subsets of languages <!-- see sonr -->
* prototyping language features (eg. pipe operator etc)
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
+ no AST complexities

```js
import {evaluate} from 'subscript.js'
evaluate(['+', ['*', 'min', 60], '"sec"'], {min: 5}) // 300sec
```


### Literals

Some parts are non-configurable:

* `[` is reserved for property access
* `(` is reserved for calls or groups
* `.` is reserved for non-calculating property access
* `,` is reserved for sequencing (doesn't create groups)
* `"` is reserved for strings.
<!-- * `:` is reserved for key separator -->
<!-- * `?:`, `|>`, `, in` ternary operators -->

### Operators

Default operators include common operators for the listed languages in the following precedence:

* `. ( [`
* `! + - ++ --` unary, (`~` − Justin)
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

// set operators by precedence
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
operators[9]['|'] = (a,b)=>a.pipe(b)  // binary
operators[1]['&'] = (a)=>address(a)   // unary (both prefix or postfix notation)
```

### Transforms

Some rules are applied to parsed nodes, simplifying resulting calltree:

* Calls `a(b,c)(d)` → `['(', 'a', [',', 'b', 'c'], 'd']` → `[['a', 'b', 'c'], 'd']`
* Property access `a.b.c` → `['.', 'a', 'b', 'c']` → `['.', 'a', '"b"', '"c"']`

They can be used to organize ternary/combining operators:

```js
import {parse, transforms, operators} from 'subscript.js'

operators[12][':']=(a,b)=>[a,b]
operators[12]['?']=(a,b)=>a??b
transforms[':'] = node => node[1]==='?' ? ['?:',node[1][0],node[1][1],node[2]] : node // [:, [?, a, b], c] → [?:, a, b, c]
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
