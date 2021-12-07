// calltree → result
export const evaluate = (node, ctx={}) => {
  if (typeof node === 'string')
    return node[0]==='@' ? node.slice(1) : ctx[node]

  if (Array.isArray(node)) {
    // [[a,b], c] or ['+', a, b] or ['myfn', a, b], or
    let c = node[0], fn = Array.isArray(c) ? evaluate(c, ctx) : (lookup[c] || ctx[c] || c), args=[], i = 1
    for (;i<node.length;i++) args.push(evaluate(node[i], ctx))
    return args.length > fn.length && fn.length ? args.reduce(fn) : fn.apply(c,args)
  }

  return node
},
lookup = {},

// op evaluators
// multiple args allows shortcuts, lisp compatible, easy manual eval, functions anyways take multiple arguments
operator = evaluate.operator = (op, fn) => lookup[op] = fn

export default evaluate
