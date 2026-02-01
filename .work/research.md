## AST Structure Decisions

### AST vs CST (2026-02-01)

**Decision:** Subscript produces AST (Abstract Syntax Tree), not CST (Concrete Syntax Tree).

| Type | Purpose | Preserves | Use case |
|------|---------|-----------|----------|
| CST | Source-faithful | All tokens, whitespace | Formatters, refactoring |
| AST | Semantic structure | Meaning only | Compilers, evaluators |

**Implications:**
- Delimiters like `()` `{}` stripped when purely syntactic
- Keywords preserved when they carry meaning (`catch`, `finally`)
- Normalization happens in parser, not compiler
- Lisp tradition: `(if cond then else)` not `(if cond then (else body))`

---

### Delimiter Handling (2026-02-01)

**Principle:** Strip delimiters when purely syntactic, keep when semantic.

| Construct | Parens meaning | Result |
|-----------|---------------|--------|
| `if (cond)` | Required syntax | Strip → `['if', cond, ...]` |
| `while (cond)` | Required syntax | Strip → `['while', cond, ...]` |
| `f(a, b)` | Call operator | Keep → `['()', 'f', ...]` |
| `(a, b) => x` | Grouping | Keep → `['=>', ['()', ...], ...]` |

**Why arrow keeps `['()']`:** Distinguishes `a => x` from `(a) => x`. Also, Python would need this to distinguish tuple `(a, b)` from grouping.

**Core helper:** `parens()` in parse.js strips and returns content. Features use it when parens are syntactic.

---

### Try/catch structure (2026-02-01)

**Decision:** Keywords as operators: `['try', body, ['catch', param, handler]?, ['finally', cleanup]?]`

**Rationale:**
- `catch` and `finally` are distinct keywords deserving operator status
- Clean optional structure - just omit the clause
- No null padding needed
- Dialect-friendly: Python `except`, Ruby `rescue` become their own operators

**Examples:**
```
try { a } catch (e) { b }       → ['try', 'a', ['catch', 'e', 'b']]
try { a } finally { c }         → ['try', 'a', ['finally', 'c']]
try { a } catch (e) { b } finally { c } → ['try', 'a', ['catch', 'e', 'b'], ['finally', 'c']]
```

---

### If-else-if chains (2026-02-01)

  **Decision:** `['if', cond, then, ['if', cond2, then2, else]]` for C-family

  **Rejected alternatives:**
  1. `['if', c, t, ['else', ['if', ...]]]` — `else` isn't an operator, just positional marker
  2. `['if', c1, t1, c2, t2, else]` — flat chain loses structure, hard to delimit

  **Rationale:**
  - JS/C have no `else if` token — else branch contains if statement
  - Position 4 = else branch, which can be any expression including another if
  - Minimal structure: no invented wrappers
  - Compiles trivially: `c(ctx) ? t(ctx) : e?.(ctx)`

  **Dialect handling:**
  - Python `elif` IS a keyword → `['if', c, t, ['elif', c2, t2, ['else', e]]]`
  - Ruby `elsif` IS a keyword → `['if', c, t, ['elsif', c2, t2, ['else', e]]]`
  - The operator name reflects the source token

  **Principle:** Use C tokens as universal semantic structure. Dialects that have distinct keywords (elif, elsif) preserve them. Dialects that don't (JS else-if) don't invent them.

  ### Try-catch structure (2026-02-01)

  **Decision:** Flat `['try', body, param, catch, finally?]`

  **Rejected:** Wrapped `['finally', ['catch', ['try', body], ...], ...]`

  **Rationale:**
  - Consistent with if: flat positional args
  - One node per statement, not nested operators
  - `null` for missing parts: `['try', body, null, null, finally]`

  **Dialect handling:**
  - Python: `['try', body, 'e', except, ['else', e], finally]` (try-except has else!)
  - Ruby: `['begin', body, 'e', rescue, ensure]`

## Design Principles

  ### Token Customization

  Just as precedence is customizable via `prec()`, tokens should be customizable per dialect.

  Current: Features hardcode keywords (`keyword('try')`)

  Future possibility:
  ```js
  // Feature exports factory
  export default (tokens = {try:'try', catch:'catch', finally:'finally'}) => {
    keyword(tokens.try, ...)
  }
  ```

  This allows:
  - **subscript.js**: default C/JS tokens
  - **worm.js** (Python): `{try:'try', catch:'except', finally:'finally', throw:'raise'}`
  - **subruby.js**: `{try:'begin', catch:'rescue', finally:'ensure', throw:'raise'}`

  ### C as Universal Foundation

  C-like tokens serve as **canonical semantic representation**, not because C is superior, but because:
  1. Widely understood baseline
  2. Minimal syntax (no significant whitespace)
  3. Most languages have C-family equivalents

  Other dialects parse TO this structure (with their tokens), enabling:
  - Cross-compilation: Python AST → JS output
  - Universal tooling: one AST walker works for all
  - Round-trip within dialect: preserves source tokens
