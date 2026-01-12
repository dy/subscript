# sub*script* <a href="https://github.com/spectjs/subscript/actions/workflows/node.js.yml"><img src="https://github.com/spectjs/subscript/actions/workflows/node.js.yml/badge.svg"/></a> <a href="https://bundlejs.com/?q=subscript"><img alt="npm bundle size" src="https://img.shields.io/bundlejs/size/subscript"/></a> <a href="http://npmjs.org/subscript"><img src="https://img.shields.io/npm/v/subscript"/></a>

Safe, tiny expression evaluator.

```
npm i subscript
```

```js
import subscript from 'subscript'

const fn = subscript('a.b + c * 2')
fn({ a: { b: 1 }, c: 5 })  // 11
```

Blocks `constructor`, `__proto__`, `prototype` access. 5kb parsed, 7kb with [justin](#justin).

See **[SPECIFICATION.md](./SPECIFICATION.md)** for the tree format.

---

## Features

**subscript** — core operators: `+ - * / % = += -= *= /= %= ++ -- . [] () , ; < > <= >= == != & | ^ ~ << >> && || !`

**[justin](#justin)** — extends with: `=== !== ** ?? ?. ?: => ... [] {} // /**/ in true false null undefined NaN`

**[extras](#extras)** — control flow, templates, regex, units: `if else while for let const break continue return \`\` // /**/ 5px`

---

## Justin

_JSON + expressions_ — no-keywords JS subset (see [Jessie thread](https://github.com/endojs/Jessie/issues/66)).

```js
import justin from 'subscript/justin'

justin('{ x: 1, y: 2+2 }["x"]')()  // 1
justin('a?.b ?? c')({ a: null, c: 3 })  // 3
```

---

## Extras

Optional features, import as needed:

```js
import subscript from 'subscript/justin'
import 'subscript/feature/loop.js'

subscript(`
  let sum = 0;
  for (i = 0; i < 10; i += 1) sum += i;
  sum
`)()  // 45
```

Available: [loop](./feature/loop.js), [if](./feature/if.js), [block](./feature/block.js), [var](./feature/var.js), [template](./feature/template.js), [regex](./feature/regex.js), [unit](./feature/unit.js).

---

## Parse / Compile

```js
import { parse, compile } from 'subscript'

let tree = parse('a.b + c - 1')
// ['-', ['+', ['.', 'a', 'b'], 'c'], [,1]]

let fn = compile(tree)
fn({ a: {b: 1}, c: 2 })  // 2
```

Tree format: **[SPECIFICATION.md](./SPECIFICATION.md)**

---

## Stringify

```js
import { stringify } from 'subscript'

stringify(['+', ['*', 'min', [,60]], [,'sec']])
// 'min * 60 + "sec"'
```

---

## Extending

```js
import { binary, operator, compile } from 'subscript'

// add operator (precedence 9 = comparison level)
binary('===', 9)
operator('===', (a, b) => (a = compile(a), b = compile(b), ctx => a(ctx) === b(ctx)))
```

API: `binary`, `unary`, `nary`, `group`, `access`, `token`, `operator`.

See [./feature/\*](./feature) for examples.

---

## Performance

Parse 30k times:
```
subscript  ~150ms 🥇
jsep       ~270ms
jexl       ~1056ms
```

Eval 30k times:
```
new Function  ~7ms
subscript     ~15ms 🥈
jsep+eval     ~30ms
```

---

## Alternatives

[jsep](https://github.com/EricSmekens/jsep), [jexpr](https://github.com/justinfagnani/jexpr), [jexl](https://github.com/TomFrost/Jexl), [expr-eval](https://github.com/silentmatt/expr-eval), [math.js](https://mathjs.org/)

---

<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
