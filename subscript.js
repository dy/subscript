const isDigit = c => c >= 48 && c <= 57, // 0...9,
  isIdentifierStart = c => (c >= 65 && c <= 90) || // A...Z
      (c >= 97 && c <= 122) || // a...z
      (c == 36 || c == 95) || // $, _,
      c >= 192, // any non-ASCII
  isIdentifierPart = c => isIdentifierStart(c) || isDigit(c),
  isSpace = c => c <= 32,
  isNotQuote = c => !quotes[String.fromCharCode(c)],

  // get operator info: [operator, precedence, reducer]
  oper = (op, ops=binary, f, p) => { for (p=0;p<ops.length;) if (f=ops[p++][op]) return [op,p,f] },

  // is calltree node
  isCmd = (a,op) => Array.isArray(a) && a.length && a[0] && (op ? a[0]===op : typeof a[0] === 'string' || isCmd(a[0])),

  // apply transform to node
  tr = (node, t) => isCmd(node) ? (t = transforms[node[0]], t?t(node):node) : node

export const literals = {
  true: true,
  false: false,
  null: null
},

groups = {'(':')','[':']'},
quotes = {'"':'"'},
comments = {},

unary = [
  {
    '(':a=>a[a.length-1], // +(a+b)
  },
  {},
  {
    '!':a=>!a,
    '+':a=>+a,
    '-':a=>-a,
    '++':a=>++a,
    '--':a=>--a
  }
],

postfix = [
  {
    '++':a=>a++,
    '--':b=>b--
  }
],

// multiple args allows shortcuts, lisp compatible, easy manual eval, functions anyways take multiple arguments
// parser still generates binary groups - it's safer and clearer
binary = [
  {},
  {
    '.':(...a)=>a.reduce((a,b)=>a?a[b]:a),
    '(':(a,...args)=>a(...args),
    '[':(a,...args)=>a[args.pop()]
  },
  {},
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
  // [(,a,args] → [a,...args]
  '(': n => n.length < 3 ? n[1] :
    [n[1]].concat(n[2]==='' ? [] : n[2][0]==',' ? n[2].slice(1).map(x=>x===''?undefined:x) : [n[2]]),
  '[': n => ['.', n[1], n[2]], // [(,a,args] → ['.', a, args[-1]]
  // ',': n => n.filter(),
  // '.': s => [s[0],s[1], ...s.slice(2).map(a=>typeof a === 'string' ? `"${a}"` : a)] // [.,a,b → [.,a,'"b"'
},


parse = (expr, index=0, len=expr.length) => {
  const char = () => expr.charAt(index), code = () => expr.charCodeAt(index),

  // skip index until condition matches
  skip = is => { while (index < len && is(code())) index++; return index },

  // skip index, return skipped part
  consume = is => expr.slice(index, skip(is)),

  //
  parseOp = (ops, l=3, op) => { while (l&&!op) op=oper(expr.substr(index, l--),ops); return op },

  // `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
  consumeGroup = (curOp) => {
    skip(isSpace);

    let cc = code(), c = char(), op,
        node='' // indicates "nothing", or "empty", as in [a,,b] - impossible to get as result of parsing

    // `.` can start off a numeric literal
    if (isDigit(cc) || c === '.') node = new Number(consumeNumber());
    else if (!isNotQuote(cc)) index++, node = new String(consume(isNotQuote)), index++
    else if (isIdentifierStart(cc)) node = (node = consume(isIdentifierPart)) in literals ? literals[node] : node
    // unaries can't be mixed in binary expressions loop due to operator names conflict, must be parsed before
    else if (op = parseOp(unary)) index += op[0].length, node = tr([op[0], consumeGroup(op)])

    skip(isSpace)

    // consume expression for current precedence or group (== highest precedence)
    while ((op = parseOp()) && (op[1] < curOp[1] || groups[curOp[0]])) {
      index+=op[0].length
      // FIXME: same-group arguments should be collected before applying transform
      isCmd(node) && node.length>2 && op[0] === node[0] ? node.push(consumeGroup(op)) : node = tr([op[0], node, consumeGroup(op)])
      skip(isSpace)
    }

    // if we're at end of group-operator
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

  return consumeGroup(oper(','))
},

// calltree → result
evaluate = (s, ctx={}, c, op) => {
  if (isCmd(s)) {
    c = s[0]
    if (typeof c === 'string') op = oper(c, s.length<3?unary:binary)
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
