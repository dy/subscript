// calltree → result
export const evaluate = (node, ctx={}) => {
  if (typeof node === 'string')
    return node[0]==='@' ? node.slice(1) : ctx[node]

  if (Array.isArray(node)) {
    // [[a,b], c] or ['+', a, b] or ['myfn', a, b], or
    let c = node[0],
        fn = Array.isArray(c) ? evaluate(c, ctx) : (lookup[c] || ctx[c] || c),
        i=2, res=evaluate(node[1], ctx), args = []

    if (fn.ab) do { res = fn(res, evaluate(node[i++],ctx)) } while ( i < node.length )
    // multiple args caused by:
    // ||&& shortcuts, lisp compatiblity, manual eval, functions multiple arguments, right precedence
    else { i=1; while (i<node.length) args.push(evaluate(node[i++], ctx)); res = fn.apply(c,args) }
    // res = fn.apply(c,node.slice(1).map(v=>evaluate(v,ctx)))

    return res
  }

  return node
},
lookup = {},

// op evaluators
operator = evaluate.operator = (op, fn) => (lookup[op] = fn, fn.ab = fn.length==2)

export default evaluate
