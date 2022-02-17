// evaluate ast tree
export const evaluate = (tree, ctx) => (tree.eval || compile(tree))(ctx)

// build optimized evaluator for the tree
export const compile = (node) => !Array.isArray(node) ? ctx => ctx[node] : node.eval = operators[node[0]](...node.slice(1))

// operators or mappers from a signature to evaluator function
const operators = {}

export const operator = (op, fn, prev=operators[op]) => operators[op] = (...args) => fn(...args) || prev && prev(...args)
