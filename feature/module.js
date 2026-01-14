/**
 * Import/Export statements
 *
 * AST:
 *   import './x.js'                    → ['import', path]
 *   import { a, b } from './x.js'      → ['import', path, ['{}', 'a', 'b']]
 *   import { a as b } from './x.js'    → ['import', path, ['{}', ['as', 'a', 'b']]]
 *   import * as X from './x.js'        → ['import', path, ['*', 'X']]
 *   import X from './x.js'             → ['import', path, ['default', 'X']]
 *
 *   export const x = 1                 → ['export', ['const', 'x', val]]
 *   export function x() {}             → ['export', ['function', 'x', ...]]
 *   export { a, b }                    → ['export', ['{}', 'a', 'b']]
 *   export { a as b }                  → ['export', ['{}', ['as', 'a', 'b']]]
 *   export default x                   → ['export', ['default', val]]
 *   export { a } from './x.js'         → ['export', ['{}', 'a'], path]
 *   export * from './x.js'             → ['export', ['*'], path]
 */
import { token, expr, skip, space, err, next, parse, idx, cur } from '../src/parse.js'
const STATEMENT = 5, STAR = 42, AS = 'as', FROM = 'from', DEFAULT = 'default'
const OBRACE = 123, CBRACE = 125, COMMA = 44;

// Parse: { a, b, c as d }
const parseBindings = () => {
  const bindings = []
  skip() // {
  while (space() !== CBRACE) {
    const name = next(parse.id)
    if (!name) err('Expected identifier')
    space()
    // Check for 'as' alias
    if (cur.slice(idx, idx + 2) === AS && !parse.id(cur.charCodeAt(idx + 2))) {
      skip(2) // 'as'
      space()
      const alias = next(parse.id)
      if (!alias) err('Expected identifier after as')
      bindings.push([AS, name, alias])
    } else {
      bindings.push(name)
    }
    space()
    if (cur.charCodeAt(idx) === COMMA) skip()
  }
  skip() // }
  return ['{}', ...bindings]
}

// Parse string literal (path)
const parseString = () => {
  const q = cur.charCodeAt(idx)
  if (q !== 34 && q !== 39) err('Expected string')
  skip()
  let str = ''
  while (cur.charCodeAt(idx) !== q) {
    if (!cur[idx]) err('Unterminated string')
    str += cur[idx]
    skip()
  }
  skip()
  return str
}

// Parse 'from' keyword and path
const parseFrom = () => {
  space()
  if (cur.slice(idx, idx + 4) !== FROM) err("Expected 'from'")
  skip(4) // 'from'
  space()
  return parseString()
}

// import ...
token('import', STATEMENT, a => {
  if (a) return
  space()
  const c = cur.charCodeAt(idx)

  // import './path.js'
  if (c === 34 || c === 39) return ['import', parseString()]

  // import * as X from './path.js'
  if (c === STAR) {
    skip(); space()
    if (cur.slice(idx, idx + 2) !== AS) err("Expected 'as'")
    skip(2); space()
    const name = next(parse.id)
    if (!name) err('Expected identifier')
    return ['import', parseFrom(), ['*', name]]
  }

  // import { a, b } from './path.js'
  if (c === OBRACE) {
    const bindings = parseBindings()
    return ['import', parseFrom(), bindings]
  }

  // import X from './path.js'
  const name = next(parse.id)
  if (!name) err('Expected identifier or {')
  space()

  // import X, { a, b } from './path.js'
  if (cur.charCodeAt(idx) === COMMA) {
    skip(); space()
    if (cur.charCodeAt(idx) === OBRACE) {
      const bindings = parseBindings()
      return ['import', parseFrom(), [DEFAULT, name], bindings]
    }
    err('Expected {')
  }

  return ['import', parseFrom(), [DEFAULT, name]]
})

// export ...
token('export', STATEMENT, a => {
  if (a) return
  space()
  const c = cur.charCodeAt(idx)

  // export * from './path.js'
  if (c === STAR) { skip(); return ['export', ['*'], parseFrom()] }

  // export { a, b } [from './path.js']
  if (c === OBRACE) {
    const bindings = parseBindings()
    space()
    return cur.slice(idx, idx + 4) === FROM ? ['export', bindings, parseFrom()] : ['export', bindings]
  }

  // export default ...
  if (cur.slice(idx, idx + 7) === DEFAULT) {
    skip(7); space()
    return ['export', [DEFAULT, expr(STATEMENT)]]
  }

  // export const/let/function/class
  const decl = expr(STATEMENT - 1)
  if (!decl) err('Expected declaration after export')
  return ['export', decl]
})
