let index, cur, end, lastOp

const code = () => cur.charCodeAt(index), // current char code
  char = (n=1) => cur.substr(index, n), // next n chars
  err = (msg) => { throw Error(msg + ' at ' + index) },
  next = (is, from=index, n) => { // number indicates skip & stop (don't check)
    while (n=is(code())) if (index+=n, typeof n ==='number') break // 1 + true === 2;
    return cur.slice(from, index)
  },
  space = () => { while (code() <= 32) index++ },

  // consume operator that resides within current group by precedence
  operator = (ops, op, prec, l=3) => {
    if (index >= cur.length) return

    // memoize by index - saves 20% to perf
    if (index && lastOp[2] === index) return lastOp

    // don't look up for end characters - saves 5-10% to perf
    if (end && end === char(end.length)) return

    // ascending lookup is faster 1-char operators, longer for 2+ char ops
    while (l) if ((prec=ops[op=char(l--)])!=null) return lastOp = [op, prec, index] //opinfo
  },

  isCmd = a => Array.isArray(a) && (typeof a[0] === 'string' || isCmd(a[0])),
  map = (node, t) => isCmd(node) ? (t = parse.map[node[0]], t?t(node):node) : node


export const
// `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
group = (curOp, rootEnd=end, curEnd) => {
  index += curOp[0].length // group always starts with an operator +-b, a(b, +(b, a+b+c, so we skip it

  if (curEnd = parse.group[curOp[0]]) end = curEnd // also we write root end marker

  space();

  let cc = code(), op, c = char(), node, i=0

  // parse node by token parsers
  // FIXME: maybe instead of just next it's worth exposing full parsing st (that can later be merged into class?)
  parse.token.find(token => (node = token()) !== '')
  // if (node === '') (op = operator(parse.prefix)) && (node = map([op[0], group(op)]))

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
  if (curEnd) index+=curEnd.length, end=rootEnd

  return node;
},

unary = op => (op = operator(parse.prefix)) && map([op[0], group(op)]), // FIXME: consolidate into group

float = (number, c, e, isDigit) => {
  const E = 69, _E = 101, PLUS = 43, MINUS = 45, PERIOD = 46
  number = next(isDigit = c => c >= 48 && c <= 57) + next(c => c === PERIOD && 1) + next(isDigit)
  if (number)
    if (e = next(c => (c === E || c === _E) && 1))
      number += e + next(c => (c === PLUS || c === MINUS) && 1) + next(isDigit)
  return number && parseFloat(number)
},

string = (q,qc) => (
  (q = next(c => (c === 34 || c === 39) && (qc=code()) && 1)) && (q + next(c => c !== qc) + next(c => 1))
),

id = (node, isId, cc, sem=0) => {
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
  // const PERIOD = 46,
  //       OPAREN = 40, // (
  //       CPAREN = 41, // )
  //       OBRACK = 91, // [
  //       CBRACK = 93; // ]

  // while (next(c => (c === PERIOD) && (cc=c, 1))) {
  //   if (cc === PERIOD) node = ['.', node, '"' + next(isId) + '"']
  //   // else if (cc === OBRACK) node = ['[', node].concat(group(']')||[])
  //   // FIXME: this might be suboptimal
  //   // else if (cc === OPAREN) node = [node, next(c => (c === CPAREN ? sem-- && true : c === OPAREN ? (sem++, true) : true ))]
  // }

  return node
},

parse = Object.assign(
  expr => (cur=expr, index=0, group(lastOp = ['', -1])),
  {
    group: {'(':')','[':']'}, // FIXME: consolidate under group
    token: [float, string, id, unary],

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
      '.': 11, '[': 11, '(': 11
    },

    // FIXME: ideally these should be merged into `token` - we could parse group/prop as single token, as jsperf does
    map: {
      '(': n => n.length < 3 ? n[1] : n.slice(1).reduce(
          (a,b)=>[a].concat(b==null ? [] : b[0]==',' ? b.slice(1).map(x=>x===''?undefined:x) : [b]),
        ), // [(,a,args1,args2] → [[a,...args1],...args2]
      '[': n => (n[0]='.',n),
      '.': n => ['.',n[1],...n.slice(2).map(s=>typeof s === 'string' ? '"'+s+'"' : s)] // [.,a,b] → [.,a,"b"]
    }
  }
),

// calltree → result
evaluate = Object.assign((s, ctx={}, c, op) => {
  if (isCmd(s)) {
    c = s[0]
    if (typeof c === 'string') op = evaluate.operator[c]
    c = op || evaluate(c, ctx) // [[a,b], c]
    if (typeof c !== 'function') return c

    return c.call(...s.map(a => evaluate(a,ctx)))
  }
  if (s && typeof s === 'string')
    return s[0] === '"' ? s.slice(1,-1)
          : s[0]==='@' ? s.slice(1)
          : s in ctx ? ctx[s] : s

  return s
}, {
  // op evaluators
  // multiple args allows shortcuts, lisp compatible, easy manual eval, functions anyways take multiple arguments
  operator: {
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
})

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s,  ctx => evaluate(s, ctx))

