const isDigit = c => c >= 48 && c <= 57, // 0...9,
  isIdentifierStart = c =>
    (c >= 65 && c <= 90) || // A...Z
    (c >= 97 && c <= 122) || // a...z
    c == 36 || c == 95 || // $, _,
    c >= 192, // any non-ASCII
  isIdentifierPart = c => isDigit(c) || isIdentifierStart(c),
  isSpace = c => c <= 32,
  isCmd = (a,op) => Array.isArray(a) && a.length && a[0] && (op ? a[0]===op : typeof a[0] === 'string' || isCmd(a[0])),
  map = (node, t) => isCmd(node) ? (t = parse.map[node[0]], t?t(node):node) : node

const parse = (expr, index=0, prevOp, curEnd) => {
  const char = (n=1) => expr.substr(index, n), // get next n chars (as fast as expr[index])
  code = () => expr.charCodeAt(index),

  err = msg => {throw Error(msg + ' at ' + index)},

  space = () => {while (code() <= 32) index++},

  // skip index, return skipped part
  consume = (is, from=index) => {
    while (is(code())) index++
    return expr.slice(from, index)
  },

  // consume operator that resides within current group by precedence
  consumeOp = (ops, op, prec, l=3) => {
    if (index >= expr.length) return

    // memoize by index - saves 20% to perf
    if (index && prevOp[3] === index) return prevOp

    // don't look up for end characters - saves 5-10% to perf
    if (curEnd && curEnd === char(curEnd.length)) return

    // ascending lookup is faster 1-char operators, longer for 2+ char ops
    // for (let i=0, prec0, op0; i < l;) if (prec0=ops[op0=char(++i)]) prec=prec0,op=op0; else if (prec) return opinfo(op, prec)
    while (l) if ((prec=ops[op=char(l--)])!=null) return prevOp = [op, prec, parse.group[op], index] //opinfo
  },

  // `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
  consumeGroup = (curOp, end=curEnd) => {
    index += curOp[0].length // group always starts with an operator +-b, a(b, +(b, a+b+c, so we skip it
    if (curOp[2]) curEnd = curOp[2] // also we write root end marker

    space();

    let cc = code(), op, c = char(), node=''
        // node= number() || string() || id() || unary() || ''

    // `.` can start off a numeric literal
    if (isDigit(cc)) node = parseInt(consume(isDigit));
    else if (parse.quote[c]) index++, node = c + consume(c=>c!=cc) + c, index++
    else if (isIdentifierStart(cc)) node = (node = consume(isIdentifierPart)) in parse.literal ? parse.literal[node] : node
    // unaries can't be mixed in binary expressions loop due to operator names conflict, must be parsed before
    else if (op = consumeOp(parse.prefix)) node = map([op[0], consumeGroup(op)])

    space()

    // consume expression for current precedence or group (== highest precedence)
    while ((op = consumeOp(parse.binary)) && (curOp[2] || op[1] < curOp[1])) {
      node = [op[0], node, consumeGroup(op)]
      // consume same-op group, that also saves op lookups
      while (char(op[0].length) === op[0]) node.push(consumeGroup(op))
      node = map(node)
      space()
    }

    // if group has end operator eg + a ) or + a ]
    if (curOp[2]) index+=curOp[2].length, curEnd=end

    return node;
  }

  return consumeGroup(prevOp = ['', 108])
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
    return parse.quote[s[0]] ? s.slice(1,-1)
          : s[0]==='@' ? s.slice(1)
          : s in ctx ? ctx[s] : s

  return s
}

Object.assign(parse, {
  literal: {
    true: true,
    false: false,
    null: null
  },
  group: {'(':')','[':']'},
  quote: {'"':'"'},
  comment: {},
  token: [
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
  map: {
    '(': n => n.length < 3 ? n[1] : n.slice(1).reduce(
        (a,b)=>[a].concat(b==='' ? [] : b[0]==',' ? b.slice(1).map(x=>x===''?undefined:x) : [b]),
      ), // [(,a,args1,args2] → [[a,...args1],...args2]
    '[': n => (n[0]='.',n),
    '.': n => typeof n[1] === 'number' ? parseFloat(n.length < 3 ? '.'+n[1] : n[1]+n[0]+n[2]) : // [.,2,1] → 2.1
      ['.',n[1],...n.slice(2).map(s=>typeof s === 'string' ? '"'+s+'"' : s)], // [.,a,b] → [.,a,"b"]
    'e': n => parseFloat(n[1]+'e'+(Array.isArray(n[2])?n[2].join(''):n[2])),
    'E': n => parse.map['e'](n)
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
