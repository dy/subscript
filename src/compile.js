import { err } from "./parse.js"

// build optimized evaluator for the tree
export const compile = (node) => !Array.isArray(node) ? compile.id(node) : !node[0] ? () => node[1] : operators[node[0]](...node.slice(1)),
  // compile id getter
  id = compile.id = name => ctx => ctx?.[name],


  // registered operators
  operators = {},

  // register an operator
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
