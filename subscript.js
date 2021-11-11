const isDigit = c => c >= 48 && c <= 57, // 0...9,
  isIdentifierStart = c => (c >= 65 && c <= 90) || // A...Z
      (c >= 97 && c <= 122) || // a...z
      (c == 36 || c == 95) || // $, _,
      c >= 192, // any non-ASCII
  isIdentifierPart = c => isIdentifierStart(c) || isDigit(c),
  isSpace = c => c <= 32,

  // is calltree node
  isCmd = (a,op) => Array.isArray(a) && a.length && a[0] && (op ? a[0]===op : typeof a[0] === 'string' || isCmd(a[0])),

  // apply transform to node
  tr = (node, t) => isCmd(node) ? (t = transforms[node[0]], t?t(node):node) : node,

  // get operator info: [operator, precedence, closing, reducer]
  opinfo = (op, ops=binary, f, prec=0) => { while (prec<ops.length) if (f=ops[prec++][op]) return [op,prec,groups[op],f] }

export const
// unary = [
//   {
//     '(':a=>a[a.length-1], // +(a+b)
//   },
//   {},
//   {
//     '!':a=>!a,
//     '+':a=>+a,
//     '-':a=>-a,
//     '++':a=>++a,
//     '--':a=>--a
//   }
// ],

// postfix = [
//   {
//     '++':a=>a++,
//     '--':b=>b--
//   }
// ],

// // multiple args allows shortcuts, lisp compatible, easy manual eval, functions anyways take multiple arguments
// // parser still generates binary groups - it's safer and clearer
// binary = [
//   {},
//   {
//     '.':(...a)=>a.reduce((a,b)=>a?a[b]:a),
//     '(':(a,...args)=>a(...args),
//     '[':(a,...args)=>a[args.pop()]
//   },
//   {},
//   {
//     '%':(...a)=>a.reduce((a,b)=>a%b),
//     '/':(...a)=>a.reduce((a,b)=>a/b),
//     '*':(...a)=>a.reduce((a,b)=>a*b),
//   },
//   {
//     '+':(...a)=>a.reduce((a,b)=>a+b),
//     '-':(...a)=>a.reduce((a,b)=>a-b),
//   },
//   {
//     '>>>':(a,b)=>a>>>b,
//     '>>':(a,b)=>a>>b,
//     '<<':(a,b)=>a<<b,
//   },
//   {
//     '>=':(a,b)=>a>=b,
//     '>':(a,b)=>a>b,
//     '<=':(a,b)=>a<=b,
//     '<':(a,b)=>a<b,
//   },
//   {
//     '!=':(a,b)=>a!=b,
//     '==':(a,b)=>a==b,
//   },
//   {'&':(a,b)=>a&b},
//   {'^':(a,b)=>a^b},
//   {'|':(a,b)=>a|b},
//   {'&&':(...a)=>a.every(Boolean)},
//   {'||':(...a)=>a.some(Boolean)}
// ],

unary= {
  '-': 1,
  '!': 1,
  '~': 1,
  '+': 1,
  '(': 1,
  '++': 1,
  '--': 1
},

binary= {
  ',': 11,
  '||': 10, '&&': 9, '|': 8, '^': 7, '&': 6,
  '==': 5, '!=': 5, '===': 5, '!==': 5,
  '<': 4, '>': 4, '<=': 4, '>=': 4,
  '<<': 3, '>>': 3, '>>>': 3,
  '+': 2, '-': 2,
  '*': 1, '/': 1, '%': 1,
  '[':.1, '.':.1, '(':.1
},

literals= {
  'true': true,
  'false': false,
  'null': null
},

quotes = {'"':'"'},
comments = {},

transforms = {
  // [(,a,args] → [a,...args]
  // '(': n => n.length < 3 ? n[1] :
  //   [n[1]].concat(n[2]==='' ? [] : n[2][0]==',' ? n[2].slice(1).map(x=>x===''?undefined:x) : [n[2]]),
  // '[': n => ['.', n[1], n[2]], // [(,a,args] → ['.', a, args[-1]]
  // ',': n => n.filter(),
  // '.': s => [s[0],s[1], ...s.slice(2).map(a=>typeof a === 'string' ? `"${a}"` : a)] // [.,a,b → [.,a,'"b"'
},
groups = {'[':']','(':')'}


export const parse = (expr, index=0, x=0, lastOp) => {
  const char = () => expr.charAt(index), code = () => expr.charCodeAt(index),
  err = (message) => { throw new Error(message + ' at character ' + index) },

  // skip index until condition matches
  skip = is => { while (index < expr.length && is(code())) index++; return index },

  // skip index, return skipped part
  consume = is => expr.slice(index, skip(is)),

  consumeOp = (ops=binary, op, prec, info, l=3) => {
    // memoize op for index - saves 20% performance to recursion scheme
    if (lastOp && lastOp[2] === index) return lastOp
      x++, console.log(1,char())
    // while (l) if (info=opinfo(expr.substr(index, l--), ops)) return info
    while (l) if (prec=ops[op=expr.substr(index, l--)]) return lastOp = [op, prec, index]
  },

  consumeToken = () => {
    skip(isSpace);
    // if (x++>1e2) err('Whoops')

    let cc=code(), c=char(), op, node=''

    // `.` can start off a numeric literal
    if (isDigit(cc) || c === '.') node = new Number(consumeNumber());
    else if (isIdentifierStart(cc)) node = (node = consume(isIdentifierPart)) in literals ? literals[node] : node
    else if (quotes[c]) index++, node = new String(consume(c=>c!==cc)), index++
    // group loop simplifies expression loop and transforms, also removes ,; operators headache
    else if (c=groups[c]) index++, node = consumeSequence(c), index++
    // unaries can't be mixed to binary expressions loop due to operator names conflict, must be parsed before
    else if (op = consumeOp(unary)) index += op[0].length, node = tr([op[0], consumeExpression(op[1])])

    skip(isSpace)
    return node
  },

  // `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
  consumeExpression = (prec) => {
    let node = consumeToken(), op
    // consume expression for current precedence or group (== highest precedence)
    while ((op = consumeOp()) && op[1] < prec) {
      index += op[0].length
      node = [op[0], node, consumeExpression(op[1])]
      skip(isSpace)
    }

    return node;
  },

  // to remove burden of comma-operators/brackes from expression loop
  consumeSequence = (end, list=[], c) => {
    while (index < expr.length && (c=char()) !== end) {
      if (c === ',' || c === ';') index++; // ignore separators
      list.push(consumeExpression(99))
    }
    return list.length < 2 ? list[0] : list;
  },

  // `12`, `3.4`, `.5`
  consumeNumber = () => {
    let number = '', c;

    number += consume(isDigit)
    c = char()
    if (c === '.') number += c + (index++, consume(isDigit)) // .1

    c = char();
    if (c === 'e' || c === 'E') { // exponent marker
      number += c, index++
      c = char();
      if (c === '+' || c === '-') number += c, index++; // exponent sign
      number += consume(isDigit)
    }

    return number //  LITERAL
  }

  let res = consumeSequence()
  console.log('called times:', x)
  return res
},

// calltree → result
evaluate = (s, ctx={}, c, op) => {
  if (isCmd(s)) {
    c = s[0]
    if (typeof c === 'string') op = opinfo(c, s.length<3?unary:binary)
    c = op ? op[2] : evaluate(c, ctx)
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

