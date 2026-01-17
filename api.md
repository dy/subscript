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

## Parser Presets

Default is **expr** (minimal). Upgrade for more features:

| Preset | Features |
|--------|----------|
| **expr** *(default)* | `+ - * / % < > == != ! . [] ()` |
| **justin** | + `&& || ?? ?: => [] {} ...` templates, JSON |
| **jessie** | + `if for while function try` statements |

```js
// Upgrade to justin
import { parse } from 'subscript/parse/justin.js'
subscript.parse = parse

// Or jessie for full JS subset
import { parse } from 'subscript/parse/jessie.js'
subscript.parse = parse
```

---

## Compiler Targets

| Target | Import | Output |
|--------|--------|--------|
| **js** | `compile/js.js` | Evaluator function |
| **js-emit** | `compile/js-emit.js` | JS source string |

```js
import { compile } from 'subscript/compile/js.js'
import { codegen } from 'subscript/compile/js-emit.js'

const ast = ['+', 'a', [, 1]]
compile(ast)({ a: 2 })  // 3
codegen(ast)            // '(a + 1)'
```

---

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
