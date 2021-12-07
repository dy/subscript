// calltree → result
export const evaluate = (node, ctx={}) => {
  if (typeof node === 'string')
    return node[0]==='@' ? node.slice(1) : ctx[node]

  if (Array.isArray(node)) {
    // [[a,b], c] or ['+', a, b] or ['myfn', a, b], or
    let c = node[0],
        fn = Array.isArray(c) ? evaluate(c, ctx) : (lookup[c] || ctx[c] || c),
        i=1, res=[]

    if (fn.r) { res=evaluate(node[i++], ctx); do { res = fn(res, evaluate(node[i++],ctx)) } while ( i < node.length ) }
    else { while ( i < node.length ) res.push(evaluate(node[i++], ctx)); res = fn.apply(c,res) }

    return res
  }

  return node
},
lookup = {},

// op evaluators
// multiple args (fn.r=false) are caused by:
// ||&& shortcuts, lisp compatiblity, manual eval, functions multiple arguments, right precedence
operator = evaluate.operator = (op, fn) => (lookup[op] = fn, fn.r = fn.length==2)

export default evaluate
