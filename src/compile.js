// build optimized evaluator for the tree
export const compile = (node) => !Array.isArray(node) ? ctx => ctx?.[node] : !node[0] ? () => node[1] : operators[node[0]](...node.slice(1)),

  // registered operators
  operators = {},

  // register an operator
  operator = (op, fn, prev = operators[op]) => (operators[op] = (...args) => fn(...args) || prev && prev(...args)),

  // takes node and returns evaluator depending on the case with passed params (container, path, ctx) =>
  access = (node, id, prop, computed, generic) =>
    // (((x))) => x
    node[0] === '()' ? access(node[1], id, prop, computed, generic) :
      // (_, name, ctx) => ctx[path]
      typeof node === 'string' ? id.bind(0, 0, node) :
        // (container, path, ctx) => container(ctx)[path]
        node[0] === '.' ? prop.bind(0, compile(node[1]), node[2]) :
          // (container, path, ctx) => container(ctx)[path(ctx)]
          node[0] === '[' ? computed.bind(0, compile(node[1]), compile(node[2])) :
            // (src, _, ctx) => src(ctx)
            generic ? generic.bind(0, compile(node), 0) : () => err('Bad left value')

export default compile
