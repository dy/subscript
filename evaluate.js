export const isCmd = a => Array.isArray(a) && (typeof a[0] === 'string' || isCmd(a[0])),

// calltree → result
evaluate = (s, ctx={}, c, op) => {
  if (isCmd(s)) {
    c = s[0]
    if (typeof c === 'string') op = lookup[c]
    c = op || evaluate(c, ctx) // [[a,b], c]
    if (typeof c !== 'function') return c
    return c.call(...s.map(a => evaluate(a,ctx)))
  }
  if (s && typeof s === 'string')
    return s[0] === '"' ? s.slice(1,-1)
      : s[0]==='@' ? s.slice(1)
      : s in ctx ? ctx[s] : s

  return s
},
lookup = {},

// op evaluators
// multiple args allows shortcuts, lisp compatible, easy manual eval, functions anyways take multiple arguments
operator = evaluate.operator = (op, fn) => lookup[op] = fn.length == 2 ? (...a)=>a.reduce(fn) : fn

export default evaluate
