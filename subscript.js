const parse = (expr, index=0, lastOp, expectEnd) => {
  const char = (n=1) => expr.substr(index, n), // get next n chars (as fast as expr[index])
  code = () => expr.charCodeAt(index),

  err = msg => {throw Error(msg + ' at ' + index)},

  space = () => {while (code() <= 32) index++},

  // consume operator that resides within current group by precedence
  operator = (ops, op, prec, l=3) => {
    if (index >= expr.length) return

    // memoize by index - saves 20% to perf
    if (index && lastOp[3] === index) return lastOp

    // don't look up for end characters - saves 5-10% to perf
    if (expectEnd && expectEnd === char(expectEnd.length)) return

    // ascending lookup is faster 1-char operators, longer for 2+ char ops
    // for (let i=0, prec0, op0; i < l;) if (prec0=ops[op0=char(++i)]) prec=prec0,op=op0; else if (prec) return opinfo(op, prec)
    while (l) if ((prec=ops[op=char(l--)])!=null) return lastOp = [op, prec, parse.group[op], index] //opinfo
  },

  // `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
  group = (curOp, end=expectEnd) => {
    index += curOp[0].length // group always starts with an operator +-b, a(b, +(b, a+b+c, so we skip it
    if (curOp[2]) expectEnd = curOp[2] // also we write root end marker

    space();

    let cc = code(), op, c = char(), node, i=0

    // parse node by token parsers
    tokens.find(token => (node = token(next)) !== '')

    space()

    // consume expression for current precedence or group (== highest precedence)
    while ((op = operator(parse.binary)) && (curOp[2] || op[1] < curOp[1])) {
      node = [op[0], node]
      // consume same-op group, that also saves op lookups
      while (char(op[0].length) === op[0]) node.push(group(op))
      node = map(node)
      space()
    }

    // if group has end operator eg + a ) or + a ]
    if (curOp[2]) index+=curOp[2].length, expectEnd=end

    return node;
  },

  unary = op => (op = operator(parse.prefix)) && map([op[0], group(op)]),
  tokens = [...parse.token, unary],

  // consume until condition matches
  next = (is, from=index, n) => {
    if (typeof is === 'number') index+=is;
    else while (n=is(code())) if (index+=n, typeof n ==='number') break // 1 + true === 2
    return expr.slice(from, index)
  }

  return group(lastOp = ['', 108])
},

// calltree → result
evaluate = (s, ctx={}, c, op) => {
  if (isCmd(s)) {
    c = s[0]
    if (typeof c === 'string') op = evaluate.operator[c]
    c = op || evaluate(c, ctx) // [[a,b], c]
    if (typeof c !== 'function') return c

    return c.call(...s.map(a=>evaluate(a,ctx)))
  }
  if (s && typeof s === 'string')
    return s[0] === '"' ? s.slice(1,-1)
          : s[0]==='@' ? s.slice(1)
          : s in ctx ? ctx[s] : s

  return s
},

// utils
isCmd = a => Array.isArray(a) && (typeof a[0] === 'string' || isCmd(a[0])),
map = (node, t) => isCmd(node) ? (t = parse.map[node[0]], t?t(node):node) : node

Object.assign(parse, {
  group: {'(':')','[':']'},
  token: [
    // float
    (next) => {
      let number, c, e,
        isDigit = c => c >= 48 && c <= 57,
        E = 69, _E = 101, PLUS = 43, MINUS = 45, PERIOD = 46
      number = next(isDigit) + next(c => c === PERIOD ? 1 : 0) + next(isDigit)
      if (number)
        if (e = next(c => c === E || c === _E ? 1 : 0))
          number += e + next(c => c === PLUS || c === MINUS ? 1 : 0) + next(isDigit)
      return number && parseFloat(number)
    },

    // string '"
    (next,q,qc) => (
      (q = next(c => c === 34 || c === 39 ? 1 : 0)) && (qc = q.charCodeAt(0), q + next(c => c !== qc) + next(1))
    ),

    // identifier
    function id(next, node) {
      node = next(c =>
        (c >= 65 && c <= 90) || // A...Z
        (c >= 97 && c <= 122) || // a...z
        c == 36 || c == 95 || // $, _,
        c >= 192 // any non-ASCII
      )
      if (!node) return node
      else if (node === 'true') return true
      else if (node === 'false') return false
      else if (node === 'null') return null

      // parse props
      // const PERIOD = 46
      // while (p = next(c => c === PERIOD))

      return node
    }
  ],
  prefix: {
    '-': 2,
    '!': 2,
    '+': 2,
    '(': 2,
    '++': 2,
    '--': 2,
    '.': 1
  },
  postfix: {
    '++': 2,
    '--': 2
  },
  binary: {
    ',': 12,
    '||': 11, '&&': 10, '|': 9, '^': 8, '&': 7,
    '==': 6, '!=': 6,
    '<': 5, '>': 5, '<=': 5, '>=': 5,
    '<<': 4, '>>': 4, '>>>': 4,
    '+': 3, '-': 3,
    '*': 2, '/': 2, '%': 2,
    '.': 1, '(': 1, '[': 1,
    'e': 1, 'E': 1
  },
  // FIXME: ideally these should be merged into `token` - we could parse group/prop as single token, as jsperf does
  map: {
    '(': n => n.length < 3 ? n[1] : n.slice(1).reduce(
        (a,b)=>[a].concat(b==null ? [] : b[0]==',' ? b.slice(1).map(x=>x===''?undefined:x) : [b]),
      ), // [(,a,args1,args2] → [[a,...args1],...args2]
    '[': n => (n[0]='.',n),
    '.': n => ['.',n[1],...n.slice(2).map(s=>typeof s === 'string' ? '"'+s+'"' : s)] // [.,a,b] → [.,a,"b"]
  }
})

// op evaluators
// multiple args allows shortcuts, lisp compatible, easy manual eval, functions anyways take multiple arguments
evaluate.operator = {
  '!':a=>!a,
  '++':a=>++a,
  '--':a=>--a,

  '.':(...a)=>a.reduce((a,b)=>a?a[b]:a),
  '(':(a,...args)=>a(...args),
  '[':(a,...args)=>a[args.pop()],

  '%':(...a)=>a.reduce((a,b)=>a%b),
  '/':(...a)=>a.reduce((a,b)=>a/b),
  '*':(...a)=>a.reduce((a,b)=>a*b),

  '+':(...a)=>a.reduce((a,b)=>a+b),
  '-':(...a)=>a.length < 2 ? -a : a.reduce((a,b)=>a-b),

  '>>>':(a,b)=>a>>>b,
  '>>':(a,b)=>a>>b,
  '<<':(a,b)=>a<<b,

  '>=':(a,b)=>a>=b,
  '>':(a,b)=>a>b,
  '<=':(a,b)=>a<=b,
  '<':(a,b)=>a<b,

  '!=':(a,b)=>a!=b,
  '==':(a,b)=>a==b,

  '&':(a,b)=>a&b,
  '^':(a,b)=>a^b,
  '|':(a,b)=>a|b,
  '&&':(...a)=>a.every(Boolean),
  '||':(...a)=>a.some(Boolean),
  ',':(...a)=>a.reduce((a,b)=>(a,b))
}

export { parse, evaluate }

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s,  ctx => evaluate(s, ctx))
