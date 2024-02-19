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
  prop = (a, fn, generic) => (
    // (((x))) => x
    a[0] === '()' ? prop(a[1], fn, generic) :
      // (_, name, ctx) => ctx[path]
      typeof a === 'string' ? fn.bind(0, ctx => ctx, () => a) :
        // (container, path, ctx) => container(ctx)[path]
        a[0] === '.' ? fn.bind(0, compile(a[1]), (a = a[2], () => a)) :
          // (container, path, ctx) => container(ctx)[path(ctx)]
          a[0] === '[' ? fn.bind(0, compile(a[1]), compile(a[2])) :
            // (src, _, ctx) => src(ctx)
            generic ? (a = compile(a), fn.bind(0, ctx => [a(ctx)], () => 0)) : () => err('Bad left value')
  )

export default compile
