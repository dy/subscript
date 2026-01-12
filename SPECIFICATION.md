# Subscript Tree Format

An expression tree notation.

---

## Overview

Expressions parse to trees. This document describes a format for those trees — minimal, JSON-compatible, and portable across languages.

```
[operator, ...operands]    operation
"name"                     identifier (resolved from context)
[, value]                  literal (returned as-is)
```

That's the entire format.

---

## Tree Structure

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

---

## Operator Reference

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

Note: Property access uses the literal property name as a string, not an identifier to resolve.

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
[, undefined]      undefined
[, NaN]            NaN
```

Keywords are literals — they have no operator, only a value.

### Structures
```
['[]', [',', a, b]]           [a, b]
['{}', [':', k1, v1, k2, v2]] {k1: v1, k2: v2}
```

### Functions
```
['=>', params, body]          (params) => body
['...', a]                    ...a (spread)
```

---

## Design Principles

### 1. Operator as First Element

Following McCarthy's [original Lisp](http://www-formal.stanford.edu/jmc/recursive.pdf) (1960), the operator occupies position zero. This enables uniform traversal: every node is processed identically regardless of arity.

### 2. Strings are References

An unwrapped string is always an identifier — a name to resolve from context. This prevents confusion between the *name* `"x"` and the *string value* `"x"`.

```
"x"           → resolve x from context
[, "x"]       → the literal string "x"
```

### 3. Empty Slot for Literals

The pattern `[, value]` uses JavaScript's elision syntax. The empty first position signals: *this is data, not code*. No operator means no operation.

### 4. Null Marks Position

Postfix operators use `null` to mark the absent second operand:
```
['++', 'a']        → ++a (prefix)
['++', 'a', null]  → a++ (postfix)
```

This preserves structural consistency without inventing new node types.

### 5. Flat Sequences

Associative operators flatten:
```
a + b + c  →  ['+', 'a', 'b', 'c']    // not ['+', ['+', 'a', 'b'], 'c']
```

This reflects execution semantics and enables SIMD-style optimization.


## Extension

The format accommodates domain-specific operators:

```
['LIKE', 'name', [, '%smith%']]
['BETWEEN', 'x', [, 1], [, 10]]
```

Custom operators are simply strings in position zero.

### Non-JSON Primitives

JSON supports: number, string, boolean, null. Other values require representation choices:

| Value | Options |
|-------|---------|
| `undefined` | `[, undefined]` (JS only, serializes as `[null]`) |
| `NaN` | `[, NaN]` (JS only) or keyword via context |
| `10n` (BigInt) | `['n', [, '10']]` (constructor) or `[, '10n']` (string literal) |
| `Symbol('x')` | `['()', 'Symbol', [, 'x']]` (function call) |
| `/abc/gi` | `['regex', [, 'abc'], [, 'gi']]` (constructor) or `[, '/abc/gi']` (string) |
| `100px` | `['px', [, 100]]` (operator) or `[, '100px']` (string literal) |
| `` `a${x}b` `` | `['\`', [, 'a'], 'x', [, 'b']]` (must interpolate) |

**Template literals** must be operations — they contain sub-expressions to evaluate.

**Units, regex, BigInt** can be either operators or string literals — parser decides, evaluator must match.


### Operand Validity

Operands must be valid tree nodes:

```
['px', [, 100]]    ✓  literal operand
['px', 'x']        ✓  identifier operand
['px', 100]        ✗  raw number is not a tree node
```

---

## Serialization

The format is valid JSON when serialized with standard `JSON.stringify`. Elided array elements serialize as `null`:

```js
[, 1]  →  [null, 1]
```

Implementations SHOULD accept both forms on input.

---

## Acknowledgments

Inspiration:

- **S-expressions** — McCarthy, 1960. Code as nested lists.
- **[frisk](https://github.com/porsager/frisk)** — Porsager. Evaluable arrays as function calls.
- **[nisp](https://github.com/aspect-build/aspect-cli/tree/develop/packages/nisp)** — Ysmood. JSON-compatible lisp.
- **JSON** — Crockford, 2001. Minimal format, universal adoption.

Counter-examples:

- **[ESTree](https://github.com/estree/estree)** — Verbose, JS-specific, layout-oriented rather than semantic. What not to do.

---

## License

This specification is released under [CC0](https://creativecommons.org/publicdomain/zero/1.0/). It belongs to no one and everyone.

Use it freely.

---

<p align="center">🕉</p>
