# API Reference

## Quick Start

```js
import subscript from 'subscript'

// evaluate expression
subscript`x + 1`({ x: 2 })  // 3

// with interpolation
const max = 100
subscript`x < ${max}`({ x: 50 })  // true
```

---

## Evaluate Code

### Template Tag *(recommended)*

```js
subscript`a + b`({ a: 1, b: 2 })  // 3

// caching - same template reuses compiled function
const check = () => subscript`x > 0`
check() === check() // true (cached)

// embed values
const limit = 10
subscript`x > ${limit}`({ x: 15 })  // true

// embed functions
const double = x => x * 2
subscript`${double}(x)`({ x: 5 })  // 10

// embed objects
const math = { pi: 3.14 }
subscript`${math}.pi * r * r`({ r: 2 })  // 12.56

// embed AST
subscript`${['+', 'a', 'b']} * 2`({ a: 1, b: 2 }) // 6
```

#### Detection Rules

| Value | Detected As | Result |
|-------|-------------|--------|
| `5`, `"hi"`, `true` | Primitive | Literal `[, value]` |
| `{a: 1}` | Object | Literal `[, obj]` |
| `x => x * 2` | Function | Literal `[, fn]` |
| `[1, 2, 3]` | Array (number first) | Literal `[, arr]` |
| `'varName'` | String | Identifier (AST) |
| `['+', 'a', 'b']` | Array (string first) | AST node |
| `[, 100]` | Array (undefined first) | AST literal |


### String Input

```js
subscript('a + b')({ a: 1, b: 2 })  // 3
```

No caching. Use for dynamic code.

---

## Swap Parser / Compiler

### `subscript.parse`

Default: expr (minimal). Upgrade for more features:

```js
import { parse } from 'subscript/parse/justin.js'
subscript.parse = parse  // + arrows, templates, JSON
```


### `subscript.compile`

Default: JS evaluator.

```js
import { codegen } from 'subscript/compile/js-emit.js'
subscript.compile = ast => codegen(ast)  // emit source instead
```

---

## Presets

### Default

Minimal ([common syntax](https://en.wikipedia.org/wiki/Comparison_of_programming_languages_(syntax)) for _JavaScript_, _C_, _C++_, _Java_, _C#_, _PHP_, _Swift_, _Objective-C_, _Kotlin_, _Perl_ etc.):

* - assignment: = += etc (base ops registered first)
* - logical: ! && || ??
* - bitwise: | & ^ ~ >> << >>>
* - comparison: < > <= >=
* - equality: == != === !==
* - membership: in of instanceof
* - arithmetic: + - * / %
* - pow: ** **=
* - increment: ++ --
* - literal: true, false, null, undefined, NaN, Infinity

* `a.b`, `a[b]`, `a(b)` — member access, calls
* `+a`, `-a`, `!a` — unary
* `a + b`, `a - b`, `a * b`, `a / b`, `a % b` — arithmetic
* `a < b`, `a <= b`, `a > b`, `a >= b`, `a == b`, `a != b` — comparison
* `"abc"`, `0.1`, `1.2e+3` — literals

* `a.b`, `a[b]`, `a(b)`
* `a++`, `a--`, `++a`, `--a`
* `a * b`, `a / b`, `a % b`
* `+a`, `-a`, `a + b`, `a - b`
* `a < b`, `a <= b`, `a > b`, `a >= b`, `a == b`, `a != b`
* `~a`, `a & b`, `a ^ b`, `a | b`, `a << b`, `a >> b`
* `!a`, `a && b`, `a || b`
* `a = b`, `a += b`, `a -= b`, `a *= b`, `a /= b`, `a %= b`, `a <<= b`, `a >>= b`
* `(a, (b))`, `a; b;`
* `"abc"`, `'abc'`
* `0.1`, `1.2e+3`


### Justin

_Just-in_ is no-keywords JS subset, _JSON_ + _expressions_ ([Jessie thread](https://github.com/endojs/Jessie/issues/66)).<br/>
It extends _expr_ with:

+ `a === b`, `a !== b`
+ `a ** b`, `a **= b`
+ `a ?? b`, `a ??= b`
+ `a ||= b`, `a &&= b`
+ `a >>> b`, `a >>>= b`
+ `a ? b : c`, `a?.b`, `a?.[b]`, `a?.(b)`
+ `...a`
+ `[a, b]`, `{a: b}`, `{a}`
+ `(a, b) => c`
+ `// foo`, `/* bar */`
+ `true`, `false`, `null`, `undefined`, `NaN`, `Infinity`
+ `a in b`, `a instanceof b`
+ `` `a ${x} b` ``, `` tag`...` ``

```js
import justin from 'subscript/parse/justin.js'

let fn = justin('{ x: 1, "y": 2+2 }["x"]')
fn()  // 1
```

### Jessie

Extends Justin with statements — practical JS subset inspired by [Jessie](https://github.com/endojs/Jessie).

+ `if (c) a`, `if (c) a else b`
+ `while (c) body`, `do { body } while (c)`
+ `for (init; cond; step) body`, `for (x of iter) body`, `for (x in obj) body`
+ `{ a; b }` — block scope
+ `let x`, `const x = 1`, `var x = 1`, `const {a, b} = x`
+ `break`, `continue`, `return x`
+ `throw x`, `try { } catch (e) { } finally { }`
+ `function f(a, b) { }`, `function(x) { }`, `function f(...args) {}`
+ `typeof x`, `void x`, `delete x`, `x instanceof Y`
+ `new X()`, `new X(a, b)`
+ `import`, `export`
+ `switch (x) { case a: ...; default: ... }`
+ `{ get x() {}, set y(v) {} }`
+ `/pattern/flags`

```js
import jessie from 'subscript/parse/jessie.js'

let fac = jessie(`
  function fac(n) {
    if (n <= 1) return 1;
    return n * fac(n - 1)
  };
  fac(5)
`)
fac({}) // 120
```




## Extend Parser

### `binary(op, prec, right?)`

```js
import { binary } from 'subscript'

binary('%%', 110)  // modulo precedence
// parses: a %% b → ['%%', 'a', 'b']
```

### `unary(op, prec, post?)`

```js
import { unary } from 'subscript'

unary('√', 150)       // prefix: √x
unary('°', 150, true) // postfix: x°
```

### `nary(op, prec, right?)`

Sequence operators (allows empty slots):

```js
import { nary } from 'subscript'

nary(';', 10, true)  // a; b; c → [';', 'a', 'b', 'c']
```

### `group(op, prec)`

Grouping constructs:

```js
import { group } from 'subscript'

group('()', 200)  // (a) → ['()', 'a']
group('[]', 200)  // [a] → ['[]', 'a']
```

### `access(op, prec)`

Member access:

```js
import { access } from 'subscript'

access('()', 180)  // a(b) → ['()', 'a', 'b']
access('[]', 180)  // a[b] → ['[]', 'a', 'b']
```

### `literal(op, value)`

Keyword literals:

```js
import { literal } from 'subscript'

literal('nil', null)
literal('yes', true)
```

### `token(op, prec, map)`

Low-level token handler:

```js
import { token } from 'subscript'

// Ternary: a ? b : c
token('?', 25, left => {
  if (!left) return  // needs left operand
  const then = expr(0)
  skip()  // skip ':'
  const els = expr(24)
  return ['?', left, then, els]
})
```

### Import Order

When extending operators that share a prefix (like `=`, `==`, `===`), **import shorter operators first** so longer ones are checked first in the token chain:

```js
// Correct order - = before ===
import './feature/op/assignment.js'      // =
import './feature/op/equality-strict.js' // ===

// Wrong order would make === parse as = followed by ==
```

This applies to: `=`/`==`/`===`, `!`/`!=`/`!==`, `|`/`||`, `&`/`&&`, etc.

---

## Extend Compiler

### `operator(op, handler)`

```js
import { operator, compile } from 'subscript'

operator('%%', (a, b) => {
  const ea = compile(a), eb = compile(b)
  return ctx => ((ea(ctx) % eb(ctx)) + eb(ctx)) % eb(ctx)
})

subscript`-5 %% 3`()  // 1 (true modulo)
```

### `operators`

Registry object. Override or inspect:

```js
import { operators } from 'subscript'

operators['+']  // current handler
```

### `prop(node, fn)`

Helper for property access patterns:

```js
import { prop, compile } from 'subscript'

operator('delete', a => prop(a, (obj, key) => delete obj[key]))
```

---

## Named Exports

```js
import {
  // Parser
  parse,        // parse(code) → AST
  token,        // define token
  binary,       // define binary op
  unary,        // define unary op
  nary,         // define sequence op
  group,        // define grouping
  access,       // define accessor
  literal,      // define literal

  // Compiler
  compile,      // compile(ast) → fn
  operator,     // register op handler
  operators,    // op registry
  prop,         // prop access helper
  codegen,      // ast → source string
} from 'subscript'
```

---

## AST Format

See [ast.md](./ast.md) for full specification.

```js
'x'              // identifier
[, 1]            // literal
['+', 'a', 'b']  // binary
['-', 'a']       // unary prefix
['++', 'a', null]  // unary postfix
['?', a, b, c]   // ternary
```

---

<p align="center">🕉</p>
