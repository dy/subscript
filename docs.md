# API Reference

## Quick Start

```js
import subscript from 'subscript'

// compile and evaluate
let fn = subscript('x + 1')
fn({ x: 2 })  // 3

// or one-liner
subscript('a * b')({ a: 3, b: 4 })  // 12
```



## Evaluate Code

### Function Call

```js
subscript('a + b')({ a: 1, b: 2 })  // 3
```

Parses and compiles on each call. Use for dynamic expressions.

### Template Tag *(cached)*

```js
subscript`a + b`({ a: 1, b: 2 })  // 3

// same template reuses compiled function
const check = () => subscript`x > 0`
check() === check() // true (cached)

// embed values
const limit = 10
subscript`x > ${limit}`({ x: 15 })  // true
```

### Interpolation

```js
const double = x => x * 2
subscript`${double}(x)`({ x: 5 })  // 10

// embed objects
const math = { pi: 3.14 }
subscript`${math}.pi * r * r`({ r: 2 })  // 12.56

// embed AST nodes
subscript`${['+', 'a', 'b']} * 2`({ a: 1, b: 2 }) // 6
```

**Detection rules:**

| Value | Detected As | Result |
|-------|-------------|--------|
| `5`, `"hi"`, `true` | Primitive | Literal `[, value]` |
| `{a: 1}` | Object | Literal `[, obj]` |
| `x => x * 2` | Function | Literal `[, fn]` |
| `[1, 2, 3]` | Array (number first) | Literal `[, arr]` |
| `'varName'` | String | Identifier (AST) |
| `['+', 'a', 'b']` | Array (string first) | AST node |
| `[, 100]` | Array (undefined first) | AST literal |



## Parse / Compile Separately

```js
import { parse, compile } from 'subscript'

let ast = parse('a + b')
// ['+', 'a', 'b']

let fn = compile(ast)
fn({ a: 1, b: 2 })  // 3
```


## Presets

### Subscript

Minimal [common syntax](https://en.wikipedia.org/wiki/Comparison_of_programming_languages_(syntax)) for _JavaScript_, _C_, _C++_, _Java_, _C#_, _PHP_, _Swift_, _Objective-C_, _Kotlin_, _Perl_ etc.:

* `a.b`, `a[b]`, `a(b)` — property access
* `a * b`, `a / b`, `a % b` — multiplicative
* `+a`, `-a`, `a + b`, `a - b` — additive
* `a < b`, `a <= b`, `a > b`, `a >= b` — comparison
* `a == b`, `a != b` — equality
* `!a`, `a && b`, `a || b` — logical
* `~a`, `a | b`, `a & b`, `a ^ b`, `a << b`, `a >> b` — bitwise
* `a++`, `a--`, `++a`, `--a` — increment/decrement
* `a = b`, `a += b`, `a -= b`, `a *= b`, `a /= b`, `a %= b` — assignment
* `a |= b`, `a &= b`, `a ^= b`, `a >>= b`, `a <<= b` — bitwise assignment
* `a, b`, `a; b` — sequences
* `"abc"` — double-quoted strings
* `0.1`, `1.2e3` — decimal numbers


### Justin

_Just-in_ is no-keywords JS subset, _JSON_ + _expressions ([thread](https://github.com/endojs/Jessie/issues/66)) — extends subscript with:

+ `'abc'` — single-quoted strings
+ `0x1f`, `0b11`, `0o17` — hex, binary, octal
+ `a === b`, `a !== b` — strict equality
+ `a ** b`, `a **= b` — exponentiation
+ `a ?? b`, `a ??= b` — nullish coalescing
+ `a >>> b`, `a >>>= b`, `a ||= b`, `a &&= b` — JS-specific operators
+ `a?.b`, `a?.[b]`, `a?.(b)` — optional chaining
+ `a ? b : c` — ternary
+ `a in b` — membership
+ `...a` — spread
+ `[a, b]`, `{a: b}`, `{a}` — collections
+ `(a, b) => c` — arrow functions
+ `` `a ${x} b` ``, `` tag`...` `` — templates
+ `// foo`, `/* bar */` — comments
+ `true`, `false`, `null`, `undefined`, `NaN`, `Infinity` — literals

```js
import justin from 'subscript/justin.js'

justin`{ x: 1, y: 2+2 }.x`({})  // 1
```

### Jessie

Extends Justin with statements — practical JS subset (inspired by [Jessie](https://github.com/endojs/Jessie)).

+ `if (c) a`, `if (c) a else b`
+ `while (c) body`, `do { body } while (c)`
+ `for (init; cond; step) body`, `for (x of iter) body`, `for (x in obj) body`
+ `{ a; b }` — block scope
+ `let x`, `const x = 1`, `var x = 1`, `const {a, b} = x`
+ `break`, `continue`, `return x`
+ `throw x`, `try { } catch (e) { } finally { }`
+ `function f(a, b) { }`, `async function`, `function*`
+ `class X { }`, `class X extends Y { }`
+ `typeof x`, `void x`, `delete x`, `x instanceof Y`
+ `new X()`, `new X(a, b)`
+ `import`, `export`
+ `switch (x) { case a: ...; default: ... }`
+ `{ get x() {}, set y(v) {} }`
+ `/pattern/flags` — regex

```js
import jessie from 'subscript/jessie.js'

jessie`
  function fac(n) {
    if (n <= 1) return 1;
    return n * fac(n - 1)
  };
  fac(5)
`({})  // 120
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

> [!NOTE]
> When extending operators that share a prefix (like `=`, `==`, `===`), **import shorter operators first** so longer ones are checked first in the token chain.
> This applies to: `=`/`==`/`===`, `!`/`!=`/`!==`, `|`/`||`, `&`/`&&`, etc.



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



## Syntax Tree

AST has simplified lispy tree structure (inspired by [frisk](https://ghub.io/frisk) / [nisp](https://github.com/ysmood/nisp)), opposed to [ESTree](https://github.com/estree/estree):

* portable to any language, not limited to JS;
* reflects execution sequence, rather than code layout;
* has minimal overhead, directly maps to operators;
* simplifies manual evaluation and debugging;
* has conventional form and one-liner docs:

```js
'x'              // identifier
[, 1]            // literal
['+', 'a', 'b']  // binary
['-', 'a']       // unary prefix
['++', 'a', null]  // unary postfix
['?', a, b, c]   // ternary
['if', cond, then, else] // control flow
```

See full [spec](./spec.md)

<p align="center">🕉</p>
