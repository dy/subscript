let index, current, end, lastOp

const code = () => current.charCodeAt(index), // current char code
char = (n=1) => current.substr(index, n), // next n chars
err = (msg) => { throw Error(msg + ' at ' + index) },
next = (is, from=index, n) => { // number indicates skip & stop (don't check)
  while (n=is(code())) if (index+=n, typeof n ==='number') break // 1 + true === 2;
  return current.slice(from, index)
},
space = () => { while (code() <= 32) index++ },

// consume operator that resides within current group by precedence
operator = (ops, op, prec, l=3) => {
  // memoize by index - saves 20% to perf
  // if (index && lastOp[2] === index) return lastOp

  // don't look up for end characters - saves 5-10% to perf
  // if (end && end === char(end.length)) return

  // ascending lookup is faster 1-char operators, longer for 2+ char ops
  while (l) if ((prec=ops[op=char(l--)])!=null) return lastOp = [op, prec, index] //opinfo
},

isCmd = a => Array.isArray(a) && (typeof a[0] === 'string' || isCmd(a[0])),

// `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
expr = (end, curOp = ['', -1]) => {
  index += curOp[0].length // group always starts with an operator +-b, a(b, +(b, a+b+c, so we skip it

  // if (curEnd = parse.group[curOp[0]]) end = curEnd // also we write root end marker

  space()

  let cc = code(), op, c = char(), node, i=0

  // parse node by token parsers
  // FIXME: maybe instead of just next it's worth exposing full parsing st (that can later be merged into class?)
  parse.token.find(token => (node = token()) !== '')
  if (node === '') (op = operator(parse.prefix)) && (node = [op[0], expr(end, op)])
  if (node === '') node = undefined

  space()

  // consume expression for current precedence or group (== highest precedence)
  while ((code() !== end && index < current.length) && (op = operator(parse.binary)) && op[1] > curOp[1]) {
    node = [op[0], node]
    // consume same-op group, that also saves op lookups
    while (char(op[0].length) === op[0]) node.push(expr(end, op))
    space()
  }

  // if group has end operator eg + a ) or + a ]
  // if (curEnd) index+=curEnd.length, end=rootEnd

  return node;
},

// tokens
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
group = (OPEN=40, CLOSE=41, node='') => {
  if (code() === OPEN) index++, node = expr(CLOSE), index++
  return node
},
id = (node, isId, cc, sem=0) => {
  node = next(isId = c =>
    (c >= 48 && c <= 57) || // 0..9
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    c >= 192 // any non-ASCII
  )

  // literals
  if (!node) return node
  else if (node === 'true') return true
  else if (node === 'false') return false
  else if (node === 'null') return null
  space()

  // a.b[c](d).e can be treated as single token - faster & shorter than making ([., a separate operator (see plan)
  const PERIOD = 46, OPAREN = 40, CPAREN = 41, OBRACK = 91, CBRACK = 93
  while ( cc = code(), cc === PERIOD || cc === OPAREN || cc === OBRACK ) {
    index++, space()
    if (cc === PERIOD) node = ['.', node, '"' + next(isId) + '"'], space()
    else if (cc === OBRACK) node = ['.', node, expr(CBRACK)], index++
    else if (cc === OPAREN) node = [node, expr(CPAREN)], index++
    space()
  }

  return node
},

parse = Object.assign(
  str => (current=str, index=0, expr()),
  {
    token: [group, float, string, id],

    prefix: {
      '-': 10,
      '!': 10,
      '+': 10,
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
      '*': 10, '/': 10, '%': 10
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

export { parse, evaluate }

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s,  ctx => evaluate(s, ctx))

