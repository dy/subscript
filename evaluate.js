const cache = new WeakMap

// calltree → result
export const evaluate = (node, ctx={},x, fn) => {
  // if (fn=cache.get(node)) return fn(ctx)

  if (typeof node === 'string')
    return node[0] === '"' ? node.slice(1,-1) : node[0]==='@' ? node.slice(1) : node in ctx ? ctx[node] : node

  if (Array.isArray(node) && (typeof node[0] === 'string' || Array.isArray(node[0]))) {
    // [[a,b], c] or ['+', a, b] or ['myfn', a, b], or
    let [c, ...args] = node, fn = typeof c === 'string' ? (lookup[c] || ctx[c]) : evaluate(c, ctx)
    args = args.map(a => evaluate(a, ctx))
    return fn.apply(c,args)
  }

  return node
},
lookup = {},

// op evaluators
// multiple args allows shortcuts, lisp compatible, easy manual eval, functions anyways take multiple arguments
operator = evaluate.operator = (op, fn) => lookup[op] = fn.length == 2 ? (...a)=>a.reduce(fn) : fn

export default evaluate
