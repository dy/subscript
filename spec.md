# Universal Expression Tree

Expressions parse to minimal lispy tree. Opposed to [ESTree](https://github.com/estree/estree):

- language-agnostic, can be compiled to different targets
- reflects execution sequence, rather than code layout
- has minimal overhead, directly maps to operators
- simplifies manual evaluation and debugging
- has conventional form and one-liner docs
- JSON-compatible, sparse arrays


```
[operator, ...operands]    operation
"name"                     identifier (resolved from context)
[, value]                  literal (returned as-is)
```

An expression tree is one of three forms:

### 1. Identifier

A string representing a name to be resolved from context.

```
"x"           → the value of x
"foo"         → the value of foo
```

### 2. Literal

A single-element array containing a value.

```
[, 1]         → the number 1
[, "hello"]   → the string "hello"
[, true]      → the boolean true
[, null]      → null
```

The empty first slot distinguishes literals from operations. This follows the pattern: *what has no operator is data*.

### 3. Operation

An array where the first element is the operator, followed by operands.

```
[op]                → nullary
[op, a]             → unary prefix
[op, a, null]       → unary postfix
[op, a, b]          → binary
[op, a, b, c]       → ternary
[op, a, b, c, ...]  → n-ary
```


## Operators

### Arithmetic
```
['+', a, b]        a + b
['-', a, b]        a - b
['-', a]           -a (negation)
['+', a]           +a (coercion)
['*', a, b]        a * b
['/', a, b]        a / b
['%', a, b]        a % b
['**', a, b]       a ** b
```

### Comparison
```
['==', a, b]       a == b
['!=', a, b]       a != b
['===', a, b]      a === b
['!==', a, b]      a !== b
['<', a, b]        a < b
['<=', a, b]       a <= b
['>', a, b]        a > b
['>=', a, b]       a >= b
```

### Logical
```
['!', a]           !a
['&&', a, b]       a && b
['||', a, b]       a || b
['??', a, b]       a ?? b
```

### Bitwise
```
['~', a]           ~a
['&', a, b]        a & b
['|', a, b]        a | b
['^', a, b]        a ^ b
['<<', a, b]       a << b
['>>', a, b]       a >> b
['>>>', a, b]      a >>> b
```

### Access
```
['.', a, 'b']      a.b
['[]', a, b]       a[b]
['()', a, b]       a(b)
['()', a, null]    a()
['?.', a, 'b']     a?.b
```

> [!NOTE]
> Property access uses the literal property name as a string, not an identifier to resolve.

### Assignment
```
['=', a, b]        a = b
['+=', a, b]       a += b
['-=', a, b]       a -= b
['*=', a, b]       a *= b
['/=', a, b]       a /= b
['%=', a, b]       a %= b
```

### Increment
```
['++', a]          ++a
['++', a, null]    a++
['--', a]          --a
['--', a, null]    a--
```

The `null` second operand distinguishes postfix from prefix.

### Sequence
```
[',', a, b, c]     a, b, c
[';', a, b, c]     a; b; c
```

Sequence operators flatten naturally into n-ary form.

### Conditional
```
['?', a, b, c]     a ? b : c
```

### Keywords
```
[, true]           true
[, false]          false
[, null]           null
[]                 undefined (empty array for JSON safety)
[, NaN]            NaN (JS only)
[, Infinity]       Infinity (JS only)
```

Keywords are literals — they have no operator, only a value.

### Structures
```
['[]', [',', a, b]]           [a, b]
['{}', [':', k, v]]           {k: v} (object literal)
['{}', 'a']                   {a} (object shorthand)
['{', body]                   { body } (block statement)
```

### Functions
```
['=>', params, body]          (params) => body
['...', a]                    ...a (spread)
```

### Templates
```
['`', [,'a'], 'x', [,'b']]    `a${x}b` (template literal)
['``', 'tag', [,'a'], 'x']    tag`a${x}` (tagged template)
```

Template literals contain string parts (as literals) interleaved with expression parts (as nodes).

### Statements (jessie)

### Control flow
```
['if', cond, then]            if (cond) then
['if', cond, then, else]      if (cond) then else alt
['while', cond, body]         while (cond) body
['for', head, body]           for (...) body
['for', ['of', 'x', iter], body]        for (x of iter) body
['for', ['of', ['const', 'x'], iter], body]  for (const x of iter) body
['for', ['in', 'x', obj], body]         for (x in obj) body
['for', [';', init, cond, step], body]  for (init; cond; step) body
['let', 'x']                  let x
['let', ['=', 'x', val]]      let x = val
['const', ['=', 'x', val]]    const x = val
['break']                     break
['continue']                  continue
['return']                    return
['return', val]               return val
```

### Exceptions (feature/throw.js, feature/try.js)
```
['throw', val]                                  throw val
['try', body, ['catch', 'e', handler]]          try { body } catch (e) { handler }
['try', body, ['finally', cleanup]]             try { body } finally { cleanup }
['try', body, ['catch', 'e', h], ['finally', c]] try {...} catch {...} finally {...}
```

### Function Declarations (feature/function.js)
```
['function', 'name', [',', 'a', 'b'], body]  function name(a, b) { body }
['function', '', 'x', body]                  function(x) { body }
```



## Design Principles

### 1. Operator as First Element

Following McCarthy's [original Lisp](http://www-formal.stanford.edu/jmc/recursive.pdf) (1960), the operator occupies position zero. This enables uniform traversal: every node is processed identically regardless of arity.

### 2. Strings are References or Tokens

An unwrapped string in operand position is interpreted by the operator:

- **Identifier**: resolved from context (most operators)
- **Token**: used directly as name/data (operator-specific)

```
"x"               → resolve x from context
[, "x"]           → the literal string "x"
['.', a, 'b']     → 'b' is property name (token)
['//', 'abc', 'g']→ pattern/flags are tokens
['n', '123']      → bigint digits are token
['px', '100']     → unit value is token
['function', 'f', ...] → 'f' is function name (token)
```

Operators that use tokens: `.`, `?.`, `//`, `n`, `px`/units, `=>`, `function`, `let`, `const`, `try` (catch param).

### 3. Empty Slot for Literals

The pattern `[, value]` uses JavaScript's elision syntax. The empty first position signals: *this is data, not code*. No operator means no operation.

### 4. Null Marks Position

Postfix operators use `null` to mark the absent second operand:
```
['++', 'a']        → ++a (prefix)
['++', 'a', null]  → a++ (postfix)
```

This preserves structural consistency without inventing new node types.


### 5. AST, not CST

This is an Abstract, not Concrete Syntax Tree.
The parser normalizes syntax to semantic structure.
Delimiters like `()` `{}` are stripped when purely syntactic; operators preserve meaning.

| Type | Purpose | Example |
|------|---------|---------|
| CST | Preserve source exactly | Formatters, refactoring tools |
| AST | Semantic structure | Compilers, evaluators |


### 6. Flat Sequences

Associative operators flatten:
```
a + b + c  →  ['+', 'a', 'b', 'c']    // not ['+', ['+', 'a', 'b'], 'c']
```

This reflects execution semantics and enables SIMD-style optimization.

### 7. Location Metadata

Nodes may carry a `.loc` property indicating source position:
```js
['+', 'a', 'b', loc: 5]    // operator at column 5
```

This is a non-enumerable property, ignored during serialization.


## Extension

The format accommodates domain-specific operators:

```
['LIKE', 'name', [, '%smith%']]
['BETWEEN', 'x', [, 1], [, 10]]
```

Custom operators are simply strings in position zero.

### Non-JSON Primitives

Literals (`[, value]`) hold JSON primitives only: number, string, boolean, null.

Non-JSON values use **primitive operators** with token operands:

| Value | Form |
|-------|------|
| `undefined` | `[]` (empty array, JSON round-trip safe) |
| `NaN` | `[, NaN]` (JS runtime only, serializes to `[null, null]`) |
| `Infinity` | `[, Infinity]` (JS runtime only, serializes to `[null, null]`) |
| `/abc/gi` | `['//', 'abc', 'gi']` (pattern/flags are tokens) |
| `/abc/` | `['//', 'abc']` |
| `10n` (BigInt) | `['n', '10']` (digits are token) |
| `100px` | `['px', '100']` (unit with value token) |
| `Symbol('x')` | `['()', 'Symbol', [, 'x']]` (function call) |
| `` `a${x}b` `` | `` ['`', [, 'a'], 'x', [, 'b']] `` (interpolation) |

**Regex** (`//`), **BigInt** (`n`), and **Units** (`px`, `em`, etc.) use tokens because they're syntactic parts of the primitive, like property names in `.` access.

**Template literals** must be operations — they contain sub-expressions to evaluate.


### Examples

**Property access** — name is token:
```
a.b               → ['.', 'a', 'b']
a?.b              → ['?.', 'a', 'b']
```

**Primitives** — pattern/digits/unit are tokens:
```
/abc/gi           → ['//', 'abc', 'gi']
10n               → ['n', '10']
100px             → ['px', '100']
```

**Variables** — wrap assignment expression:
```
let x             → ['let', 'x']
let x = 1         → ['let', ['=', 'x', [, 1]]]
const y = 2       → ['const', ['=', 'y', [, 2]]]
```

**For loops** — head is an expression:
```
for (x of arr) {}         → ['for', ['of', 'x', 'arr'], body]
for (const x of arr) {}   → ['for', ['of', ['const', 'x'], 'arr'], body]
for (let x of arr) {}     → ['for', ['of', ['let', 'x'], 'arr'], body]
for (x in obj) {}         → ['for', ['in', 'x', 'obj'], body]
for (;;) {}               → ['for', [';', null, null, null], body]
```

**Try/catch** — keywords preserved as operators:
```
try { a } catch (e) { b }                 → ['try', 'a', ['catch', 'e', 'b']]
try { a } finally { c }                   → ['try', 'a', ['finally', 'c']]
try { a } catch (e) { b } finally { c }   → ['try', 'a', ['catch', 'e', 'b'], ['finally', 'c']]
```

**Functions** — name and params are tokens:
```
function f(a, b) { c }    → ['function', 'f', [',', 'a', 'b'], 'c']
function(x) { y }         → ['function', '', 'x', 'y']
x => x                    → ['=>', 'x', 'x']
(a, b) => a + b           → ['=>', ['()', [',', 'a', 'b']], ['+', 'a', 'b']]
```




## Serialization

The format is valid JSON when serialized with standard `JSON.stringify`. Elided array elements serialize as `null`:

```js
[, 1]  →  [null, 1]
```

Implementations SHOULD accept both forms on input.



## Inspiration 

- **[frisk](https://www.npmjs.com/package/frisk)** — Porsager. Evaluable arrays as function calls.
- **[nisp](https://github.com/ysmood/nisp)** — Ysmood. JSON-compatible lisp.
- **Pratt parsing** — Pratt, 1973. [Top Down Operator Precedence](https://tdop.github.io/). Elegant precedence-driven parsing.
- **S-expressions** — McCarthy, 1960. Code as nested lists.
- **JSON** — Crockford, 2001. Minimal format, universal adoption.
- **[ESTree](https://github.com/estree/estree)** – opposite example


## License

This specification is released under [CC0](https://creativecommons.org/publicdomain/zero/1.0/). It belongs to no one and everyone.

<p align="center">🕉</p>
