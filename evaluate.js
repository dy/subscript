// evaluate ast tree
export const evaluate = (tree, ctx) => (tree.eval ||= compile(tree))(ctx)

// build optimized evaluator for the tree
export const compile = (node) => !Array.isArray(node) ? ctx => ctx[node] : operator[node[0]](...node.slice(1))

// operators or mappers from a signature to evaluator function
export const operator = {}
