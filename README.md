# <!--<img alt="subscript" src="/subscript2.svg" height=42/>--> sub͘<em>script</em> <!--<sub>SUB͘<em>SCRIPT</em></sub>-->

Subscript is micro-language, common subset of C++, JS, Java, Python, Go, Rust.<br/>

* You already know _subscript_
* Any _subscript_ fragment can be copy-pasted to a target language and it will work
* It's tiny <sub>![npm bundle size](https://img.shields.io/bundlephobia/minzip/subscript?color=brightgreen&label=gzip)</sub>
* Enables easy operators overloading
* Configurable & extensible
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
* subsets of languages (eg. jessie, justin) <!-- see sonr -->
* prototyping language features (eg. pipe operator)
* simulating languages (eg. glsl-transform <!--, FORTRAN?, COBOL?-->)
* sandboxes, playgrounds
* custom DSL

### Lispy tree

It compiles code to lispy calltree (like [frisk](https://npmjs.com/frisk)). Why?

+ minimal possible AST
+ no operators precedence issue
+ easy to overload operators
+ easy to mimic other lang subsets
+ easy manual evaluation
+ easy debugging
+ conventional form
+ no need in docs

```js
import {evaluate} from 'subscript.js'
evaluate(['+', ['*', 'min', 60], '"sec"'], {min: 5}) // 300sec
```


### Core primitives

* `[]`, `()` groups
* `true`, `false`, `null` literals
* `"` quotes.

All primitives are extensible.

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
import {operator, parse, evaluate} from 'subscript.js'

// set operators by precedence
operator[0]['=>'] = (args, body) => evaluate(body, args)
operator[5]['|'] = (a,...b) => a.pipe(...b)

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
operator[9]['|'] = (a,b)=>a.pipe(b)  // binary or unary postfix:  a|b, a|
operator[1]['&'] = (a)=>address(a)   // unary prefix:  &a
```

### Transforms

Some rules are applied to parsed nodes, simplifying resulting calltree:

* Calls `a(b,c)(d)` → `['(', 'a', [',', 'b', 'c'], 'd']` → `[['a', 'b', 'c'], 'd']`
* Property access `a.b.c` → `['.', 'a', 'b', 'c']` → `['.', 'a', '"b"', '"c"']`

They can be used to organize ternary/combining operators:

```js
import {parse, transform, operator} from 'subscript.js'

operator[12][':']=(a,b)=>[a,b]
operator[12]['?']=(a,b)=>a??b
transform[':'] = node => node[1]==='?' ? ['?:',node[1][0],node[1][1],node[2]] : node // [:, [?, a, b], c] → [?:, a, b, c]
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
