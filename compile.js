// build optimized evaluator for the tree
export const compile = (node) => !Array.isArray(node) ? ctx => ctx?.[node] : operator[node[0]](...node.slice(1)),

set = compile.set = (op, fn, prev=operator[op]) => operator[op] = (...args) => fn(...args) || prev && prev(...args),

operator = {}


export default compile
