const isDigit = c => c >= 48 && c <= 57, // 0...9,
  isIdentifierStart = c => (c >= 65 && c <= 90) || // A...Z
      (c >= 97 && c <= 122) || // a...z
      (c == 36 || c == 95) || // $, _,
      c >= 192, // any non-ASCII
  isIdentifierPart = c => isIdentifierStart(c) || isDigit(c),
  isSpace = c => c <= 32,
  isNotQuote = c => !quotes[String.fromCharCode(c)],

  // get precedence
  oper = (op, ops=binary, f, res, p) => { for (p=0;p<ops.length;) if (res=ops[p++][op]) return f?res:p },

  // is calltree node
  isCmd = (a,op) => Array.isArray(a) && a.length && a[0] && (op ? a[0]===op : typeof a[0] === 'string' || isCmd(a[0])),

  // indicates "nothing consumed", since undefined means 'undefined' consumed
  nil = Symbol.for('nil'),

  // if single argument - return it
  unlist = l => l.length<2?l[0]:l,

  // create calltree node from opInfo, a, b with transforms
  // Node = (op, a, b, t, n) => (n = [op[0], unlist(a), unlist(b)], t = transforms[op[0]])?t(n):n,
  tr = (node, t) => isCmd(node) ? (t = transforms[node[0]], t?t(node):node) : node,

  // unblocked throw error
  err = e => {throw new Error(e)}

export const literals = {
  true: true,
  false: false,
  null: null
},

groups = {'(':')','[':']'},
quotes = {'"':'"'},
comments = {},

// prefix
unary = [{},{
  '(':a=>a[a.length-1], // +(a+b)
  '[':a=>[...a] // +[a,b,c...]
},{
  '!':a=>!a,
  '+':a=>+a,
  '-':a=>-a,
  '++':a=>++a,
  '--':a=>--a
}],

// multiple args allows shortcuts, lisp compatible, easy manual eval, functions anyways take multiple arguments
// parser still generates binary groups - it's safer and clearer
binary = [
  {
    '.':(...a)=>a.reduce((a,b)=>a?a[b]:a),
    '(':(a,args)=>a(...args),
    '[':(a,args)=>a[args.pop()]
  },{},{},
  {
    '%':(...a)=>a.reduce((a,b)=>a%b),
    '/':(...a)=>a.reduce((a,b)=>a/b),
    '*':(...a)=>a.reduce((a,b)=>a*b),
  },
  {
    '+':(...a)=>a.reduce((a,b)=>a+b),
    '-':(...a)=>a.reduce((a,b)=>a-b),
  },
  {
    '>>>':(a,b)=>a>>>b,
    '>>':(a,b)=>a>>b,
    '<<':(a,b)=>a<<b,
  },
  {
    '>=':(a,b)=>a>=b,
    '>':(a,b)=>a>b,
    '<=':(a,b)=>a<=b,
    '<':(a,b)=>a<b,
  },
  {
    '!=':(a,b)=>a!=b,
    '==':(a,b)=>a==b,
  },
  {'&':(a,b)=>a&b},
  {'^':(a,b)=>a^b},
  {'|':(a,b)=>a|b},
  {'&&':(...a)=>a.every(Boolean)},
  {'||':(...a)=>a.some(Boolean)},
  {',':true}
],

transforms = {
  '(': n => [n[1], ...(n[2]||[])], // [(,a,args] → [a,...args]
  '[': n => ['.', n[1], n[2][n[2].length-1]] // [(,a,args] → ['.', a, args[-1]]
  // '.': s => [s[0],s[1], ...s.slice(2).map(a=>typeof a === 'string' ? `"${a}"` : a)] // [.,a,b → [.,a,'"b"'
},


parse = (expr, index=0, len=expr.length, lastOp, x=0) => {
  const char = () => expr.charAt(index),
  code = () => expr.charCodeAt(index),

  // skip index until condition matches
  skip = (f, c=code()) => { while (index < len && f(c)) c=expr.charCodeAt(++index); return index },

  // skip index, returning skipped part
  consume = f => expr.slice(index, skip(f)),

  parseOp = (ops, l=3, op, prec) => {
    while (!(prec=oper(op=expr.substr(index, l--),ops))) if (!l) return
    return [op, prec]
  },

  // `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
  consumeGroup = (curOp) => {
    if (x++>1e2) err('Whoops')

    skip(isSpace);

    let cc = code(), c = char(), node, op

    // `.` can start off a numeric literal
    if (isDigit(cc) || c === '.') node = new Number(consumeNumber());
    else if (!isNotQuote(cc)) index++, node = new String(consume(isNotQuote)), index++
    else if (isIdentifierStart(cc)) node = (node = consume(isIdentifierPart)) in literals ? literals[node] : node
    else if (op = parseOp(unary)) index += op[0].length, node = tr([op[0], consumeGroup(op)]);
    else err(`Unknown ${c} at ${index}`)

    skip(isSpace)

    // consume expression
    while ((op = parseOp(binary)) && op[1] < curOp[1]) index+=op[0].length, node = tr([op[0], node, consumeGroup(op)])

    skip(isSpace)

    // if we're at end of group-operator, bail out
    if (groups[curOp[0]] == char()) index++

    return node;
  },

  // `12`, `3.4`, `.5`
  consumeNumber = () => {
    let number = '', c = char();

    number += consume(isDigit)
    if (char() === '.') number += expr.charAt(index++) + consume(isDigit) // .1

    c = char();
    if (c === 'e' || c === 'E') { // exponent marker
      number += c, index++
      c = char();
      if (c === '+' || c === '-') number += c, index++; // exponent sign
      number += consume(isDigit)
    }

    return number //  LITERAL
  }

  return consumeGroup([',',binary.length])
},

// calltree → result
evaluate = (s, ctx={}, c, op) => {
  if (isCmd(s)) {
    // FIXME: move to transforms
    if ((c=s[0])=='.') return oper(c,binary,true)(evaluate(s[1], ctx),...s.slice(2))

    if (typeof c === 'string') op = oper(c, s.length<3?unary:binary, true)
    c = op || evaluate(c, ctx)
    if (typeof c !== 'function') return c

    return c.call(...s.map(a=>evaluate(a,ctx)))
  }

  if (s && typeof s === 'string')
    return quotes[s[0]] ? s.slice(1,-1)
          : s[0]==='@' ? s.slice(1)
          : s in ctx ? ctx[s] : s

  return s
}

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s,  ctx => evaluate(s, ctx))
