// build optimized evaluator for the tree
export const compile = (node) => !Array.isArray(node) ? ctx => ctx?.[node] : !node[0] ? () => node[1] : operators[node[0]](...node.slice(1)),

  // registered operators
  operators = {},

  // register an operator
  operator = (op, fn, prev = operators[op]) => (operators[op] = (...args) => fn(...args) || prev && prev(...args))

// literals
// null operator returns first value (needed for direct literals)
// FIXME: is there really treally no better way?
// 1. Can we make ['.','path'] to read from context, and direct primitives just return as-is?
// operator('', v => () => v)

export default compile
