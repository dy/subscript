const parse = (expr, index=0, lastOp, expectEnd) => {
  const char = (n=1) => expr.substr(index, n), // get next n chars (as fast as expr[index])
  code = () => expr.charCodeAt(index),

  err = msg => {throw Error(msg + ' at ' + index)},

  space = () => {while (code() <= 32) index++},

  // consume until condition matches
  next = (is, from=index, n) => {
    while (n=is(code())) if (index+=n, typeof n ==='number') break // 1 + true === 2; number indicates skip & stop (don't check)
    return expr.slice(from, index)
  },

  // consume operator that resides within current group by precedence
  operator = (ops, op, prec, l=3) => {
    if (index >= expr.length) return

    // memoize by index - saves 20% to perf
    if (index && lastOp[2] === index) return lastOp

    // don't look up for end characters - saves 5-10% to perf
    if (expectEnd && expectEnd === char(expectEnd.length)) return

    // ascending lookup is faster 1-char operators, longer for 2+ char ops
    while (l) if ((prec=ops[op=char(l--)])!=null) return lastOp = [op, prec, index] //opinfo
  },

  // `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
  group = (curOp, end=expectEnd, curEnd) => {
    index += curOp[0].length // group always starts with an operator +-b, a(b, +(b, a+b+c, so we skip it

    if (curEnd = parse.group[curOp[0]]) expectEnd = curEnd // also we write root end marker

    space();

    let cc = code(), op, c = char(), node, i=0

    // parse node by token parsers
    tokens.find(token => (node = token(next)) !== '')

    space()

    // consume expression for current precedence or group (== highest precedence)
    while ((op = operator(parse.binary)) && (curEnd || op[1] > curOp[1])) {
      node = [op[0], node]
      // consume same-op group, that also saves op lookups
      while (char(op[0].length) === op[0]) node.push(group(op))
      node = map(node)
      space()
    }

    // if group has end operator eg + a ) or + a ]
    if (curEnd) index+=curEnd.length, expectEnd=end

    return node;
  },

  unary = op => (op = operator(parse.prefix)) && map([op[0], group(op)]),
  tokens = [...parse.token, unary]

  return group(lastOp = ['', 0])
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
    (next, number, c, e, isDigit) => {
      const E = 69, _E = 101, PLUS = 43, MINUS = 45, PERIOD = 46
      number = next(isDigit = c => c >= 48 && c <= 57) + next(c => c === PERIOD && 1) + next(isDigit)
      if (number)
        if (e = next(c => c === E || c === _E && 1))
          number += e + next(c => c === PLUS || c === MINUS && 1) + next(isDigit)
      return number && parseFloat(number)
    },

    // string '"
    (next,q,qc) => (
      (q = next(c => c === 34 || c === 39 && 1)) && (qc = q.charCodeAt(0), q + next(c => c !== qc) + next(c => 1))
    ),

    // identifier
    (next, node, isId, c,cc) => {
      node = next(isId = c =>
        (c >= 48 && c <= 57) || // 0..9
        (c >= 65 && c <= 90) || // A...Z
        (c >= 97 && c <= 122) || // a...z
        c == 36 || c == 95 || // $, _,
        c >= 192 // any non-ASCII
      )
      if (!node) return node
      else if (node === 'true') return true
      else if (node === 'false') return false
      else if (node === 'null') return null

      // parse a.b.c props
      const PERIOD = 46,
            OPAREN = 40, // (
            CPAREN = 41, // )
            OBRACK = 91, // [
            CBRACK = 93; // ]

      while (next(c => c === PERIOD && (cc=c,1))) {
        if (cc === PERIOD) node = ['.', node, '"'+next(isId)+'"']
        // else if (cc === OBRACK) node = ['[', node].concat(group(']')||[])
        // else if (cc === OPAREN) node = [node, group(')')]
      }

      return node
    }
  ],
  prefix: {
    '-': 10,
    '!': 10,
    '+': 10,
    '(': 10,
    '++': 10,
    '--': 10
  },
  postfix: {
    '++': 10,
    '--': 10
  },
  binary: {
    ',': 0,
    '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
    '==': 6, '!=': 6,
    '<': 7, '>': 7, '<=': 7, '>=': 7,
    '<<': 8, '>>': 8, '>>>': 8,
    '+': 9, '-': 9,
    '*': 10, '/': 10, '%': 10,
    '.': 11, '(': 11, '[': 11
  },
  // FIXME: ideally these should be merged into `token` - we could parse group/prop as single token, as jsperf does
  map: {
    '(': n => n.length < 3 ? n[1] : n.slice(1).reduce(
        (a,b)=>[a].concat(b==null ? [] : b[0]==',' ? b.slice(1).map(x=>x===''?undefined:x) : [b]),
      ), // [(,a,args1,args2] → [[a,...args1],...args2]
    '[': n => (n[0]='.',n),
    // '.': n => ['.',n[1],...n.slice(2).map(s=>typeof s === 'string' ? '"'+s+'"' : s)] // [.,a,b] → [.,a,"b"]
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
