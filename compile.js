// build optimized evaluator for the tree
export const compile = (node) => !Array.isArray(node) ? ctx => ctx?.[node] : operators[node[0]](...node.slice(1)),

operators = {},

operator = (op, fn, prev=operators[op]) => operators[op] = (...args) => fn(...args) || prev && prev(...args)

export default compile
