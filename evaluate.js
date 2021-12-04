export const isCmd = a => Array.isArray(a) && (typeof a[0] === 'string' || isCmd(a[0])),

// calltree → result
evaluate = (s, ctx={}) => {
  if (isCmd(s)) {
    let [c, ...args] = s, op, preargs=args
    // [[a,b], c] or ['+', a, b] or ['myfn', a, b], or
    c = typeof c === 'string' ? (lookup[c] || ctx[c]) : evaluate(c, ctx)
    return c.apply(ctx, args.map(a => evaluate(a,ctx)))
  }
  if (s && typeof s === 'string')
    return s[0] === '"' ? s.slice(1,-1) : s[0]==='@' ? s.slice(1)
      : s in ctx ? ctx[s] : s

  return s
},
lookup = {},

// op evaluators
// multiple args allows shortcuts, lisp compatible, easy manual eval, functions anyways take multiple arguments
operator = evaluate.operator = (op, fn) => lookup[op] = fn.length == 2 ? (...a)=>a.reduce(fn) : fn

export default evaluate
