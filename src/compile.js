import { err } from "./parse.js"

/**
 * @typedef {Object.<string, OperatorFunction>} OperatorMap
 * Represents a map of operator names to their corresponding functions.
 */

/**
 * @typedef {(...args: any[]) => any} OperatorFunction
 * Represents a function for an operator, which can take any number of arguments.
 */

export const
  /**
   * Compiles a syntax tree into an evaluator function.
   * @param {Node} node - The node to compile, which can be a string or an array representing an operation.
   * @returns {Function} A function that takes a context and returns the evaluated result.
   */
  compile = (node) => !Array.isArray(node) ? compile.id(node) : !node[0] ? () => node[1] : operators[node[0]](...node.slice(1)),

  // compile id getter
  id = compile.id = name => ctx => ctx?.[name],

  /**
   * Registered operators map.
   * @type {OperatorMap}
   */
  operators = {},

  /**
   * Registers an operator function.
   * @param {string} op - The operator string.
   * @param {OperatorFunction} fn - The function that implements the operator.
   */
  operator = (op, fn, prev = operators[op]) => (operators[op] = (...args) => fn(...args) || prev && prev(...args)),

  // takes node and returns evaluator depending on the case with passed params (container, path, ctx) =>
  prop = (a, fn, generic, obj, path) => (
    // (((x))) => x
    a[0] === '()' ? prop(a[1], fn, generic) :
      // (_, name, ctx) => ctx[path]
      typeof a === 'string' ? ctx => fn(ctx, a, ctx) :
        // (container, path, ctx) => container(ctx)[path]
        a[0] === '.' ? (obj = compile(a[1]), path = a[2], ctx => fn(obj(ctx), path, ctx)) :
          // (container, path, ctx) => container(ctx)[path(ctx)]
          a[0] === '[' ? (obj = compile(a[1]), path = compile(a[2]), ctx => fn(obj(ctx), path(ctx), ctx)) :
            // (src, _, ctx) => src(ctx)
            generic ? (a = compile(a), ctx => fn([a(ctx)], 0, ctx)) : () => err('Bad left value')
  )

export default compile
