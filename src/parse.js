// @ts-check
import { SPACE } from "./const.js"

export let
  /** @type {number} The current index in the string being parsed. */
  idx,

  /** @type {string} The current string being parsed. */
  cur;

/**
 * Parse a string into an expression or throw an error if syntax is invalid.
 * @param {string} s - The string to parse.
 * @returns {any} The parsed expression or an error.
 */
export const parse = (s) => (idx = 0, cur = s, s = expr(), cur[idx] ? err() : s || '')

/**
 * Throw a syntax error with a message.
 * @param {string} [msg='Bad syntax'] - The error message.
 * @throws {EvalError} Throws an evaluation error.
 */
export const err = (msg = 'Bad syntax',
) => {
  let lines = cur.slice(0, idx).split('\n'), last = lines.pop()
  let before = cur.slice(idx - 108, idx).split('\n').pop()
  let after = cur.slice(idx, idx + 108).split('\n').shift()
  throw EvalError(`${msg} at ${lines.length}:${last?.length} \`${idx >= 108 ? '…' : ''}${before}┃${after}\``)
}

/**
 * Advance the index until the condition is met.
 * @param {(c: number) => number|boolean} is - A function to determine the advance condition.
 * @returns {string} The advanced substring.
 */
export const next = (is) => {
  let from = idx, l
  while (l = +is(cur.charCodeAt(idx))) idx += l
  return cur.slice(from, idx)
}

/**
 * Consume a specified number of characters.
 * @param {number} [n=1] - The number of characters to consume.
 * @returns {string} The consumed substring.
 */
export const skip = (n = 1, from = idx) => (idx += n, cur.slice(from, idx))

/**
 * Parse an expression with the specified precedence.
 * @param {number} [prec=0] - The precedence level.
 * @param {number} [end] - The character code that indicates the end of the expression.
 * @returns {any} The parsed token.
 */
export const expr = (prec = 0, end) => {
  let cc, token, newNode, fn;

  // chunk/token parser
  while (
    (cc = parse.space()) && // till not end
    // FIXME: extra work is happening here, when lookup bails out due to lower precedence -
    // it makes extra `space` call for parent exprs on the same character to check precedence again
    (newNode =
      ((fn = lookup[cc]) && fn(token, prec)) ?? // if operator with higher precedence isn't found
      (!token && next(parse.id)) // parse literal or quit. token seqs are forbidden: `a b`, `a "b"`, `1.32 a`
    )
  ) token = newNode;

  // check end character
  if (end) cc == end ? idx++ : err()

  return token
}

/**
 * Check if a character is a valid identifier character.
 * @param {number} c - The character code.
 * @returns {boolean} Whether the character is a valid identifier.
 */
export const id = parse.id = c =>
  (c >= 48 && c <= 57) || // 0..9
  (c >= 65 && c <= 90) || // A...Z
  (c >= 97 && c <= 122) || // a...z
  c == 36 || c == 95 || // $, _,
  (c >= 192 && c != 215 && c != 247) // any non-ASCII

/**
 * Skip space characters and return the first non-space character.
 * @returns {number} The character code of the first non-space character.
 */
export const space = parse.space = cc => { while ((cc = cur.charCodeAt(idx)) <= SPACE) idx++; return cc }

/**
 * Operator/token lookup table.
 * @type {((a: any, b: any) => any)[]}
 */
export const lookup = []

/**
 * Creates an operator checker.
 * @param {string} op - The operator string.
 * @param {number} prec - The precedence level.
 * @param {Function} map - The function to map the operator.
 */
export const token = (
  op,
  prec,
  map,
  c = op.charCodeAt(0),
  l = op.length,
  prev = lookup[c],
  word = op.toUpperCase() !== op // make sure word boundary comes after word operator
) => (lookup[c] = (a, curPrec, from = idx) =>
  (curPrec < prec && (l < 2 || cur.substr(idx, l) == op) && (!word || !parse.id(cur.charCodeAt(idx + l))) && (idx += l, map(a))) ||
  (idx = from, prev?.(a, curPrec)))

/**
 * Define a binary operator.
 * @param {string} op - The operator string.
 * @param {number} prec - The precedence level.
 * @param {boolean} [right=false] - Whether the operator is right-associative.
 */
export const binary = (op, prec, right = false) => token(op, prec, (a, b) => a && (b = expr(prec - (right ? .5 : 0))) && [op, a, b])


/**
 * Define a unary operator.
 * @param {string} op - The operator string.
 * @param {number} prec - The precedence level.
 * @param {boolean} [post=false] - Whether the operator is a postfix operator.
 */
export const unary = (op, prec, post) => token(op, prec, a => post ? (a && [op, a]) : (!a && (a = expr(prec - .5)) && [op, a]))

/**
 * Define an n-ary operator.
 * @param {string} op - The operator string.
 * @param {number} prec - The precedence level.
 */
export const nary = (op, prec) => {
  token(op, prec, (a, b) => (
    (b = expr(prec)),
    (
      (!a || a[0] !== op) && (a = [op, a]), // if beginning of sequence - init node
      b?.[0] === op ? [, ...b] = b : b = [b], a.push(...b), // comments can return same-token expr
      a
    ))
  )
}

/**
 * Define group like (a), [b], {c}, etc.
 * @param {string} op - The group operator.
 * @param {number} prec - The precedence level.
 */
export const group = (op, prec) => token(op[0], prec, a => (!a && ([op, expr(0, op.charCodeAt(1))])))

/**
 * Define access operator like a(b), a[b], a<b>, etc.
 * @param {string} op - The access operator.
 * @param {number} prec - The precedence level.
 */
export const access = (op, prec) => token(op[0], prec, a => (a && [op[0], a, expr(0, op.charCodeAt(1))]))


export default parse
