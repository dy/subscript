const isDigit = c => c >= 48 && c <= 57, // 0...9,
  isIdentifierStart = c => (c >= 65 && c <= 90) || // A...Z
      (c >= 97 && c <= 122) || // a...z
      (c == 36 || c == 95) || // $, _,
      c >= 192, // any non-ASCII
  isIdentifierPart = c => isIdentifierStart(c) || isDigit(c),
  isSpace = c => c <= 32,
  isNotQuote = c => !quotes[String.fromCharCode(c)],

  oper = (op, ops=binary, f, res, i) => { for (i=0;i<ops.length;) if (res=ops[i++][op]) return f?res:i }, // get precedence
  isCmd = (a,op) => Array.isArray(a) && a.length && a[0] && (op ? a[0]===op : typeof a[0] === 'string' || isCmd(a[0])), // is calltree node

  unlist = l => l.length<2?l[0]:l,
  nil = Symbol.for('nil'),

  // apply transforms
  Node = (op, a, b, t, n) => (n = [op, unlist(a), unlist(b)], t = transforms[op])?t(n):n,

  // throw error
  err = e => {throw new Error(e)}

export const literals = {
  true: true,
  false: false,
  null: null
},

blocks = {'(':')','[':']'},
quotes = {'"':'"'},
comments = {},

unary = [{ // prefix
  '!':a=>!a,
  '+':a=>+a,
  '-':a=>-a,
  '++':a=>++a,
  '--':a=>--a
}, { // postfix
}],

// multiple args allows shortcuts, lisp compatible, easy manual eval, functions anyways take multiple arguments
// parser still generates binary groups - it's safer and clearer
binary = [
  {
    '.':(...a)=>a.reduce((a,b)=>a?a[b]:a),
    '(':(a,args)=>a(...args),
    '[':(a,args)=>a[args.pop()]
  },
  unary,
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
],

transforms = {
  '(': n => [n[1], ...n[2]], // [(,a,args] → [a,...args]
  '[': n => ['.', n[1], n[2][n[2].length-1]] // [(,a,args] → ['.', a, args[-1]]
  // '.': s => [s[0],s[1], ...s.slice(2).map(a=>typeof a === 'string' ? `"${a}"` : a)] // [.,a,b → [.,a,'"b"'
},


parse = (expr, index=0, len=expr.length) => {
  let  x= 0
  const char = () => expr.charAt(index),
  code = () => expr.charCodeAt(index),

  // skip index until condition matches
  skip = (f, c=code()) => { while (index < len && f(c)) c=expr.charCodeAt(++index); return index },

  // skip index, returning skipped part
  gobble = f => expr.slice(index, skip(f)),

  gobbleSequence = (end) => {
    let list = [], c;
    while (index < len && (c=char()) !== end) {
      if (c === ';' || c === ',') index++; // ignore separators
      else list.push(gobbleExpression()), skip(isSpace)
    }
    if (end) index++

    return list;
  },

  gobbleOp = (ops=binary, op, l=3, prec) => {
    skip(isSpace);
    while (!(prec=oper(op=expr.substr(index, l--),ops))) if (!l) return
    if (!blocks[op]) index+=op.length // if op is a ( b - step back to let right token parse group
    return [op, prec]
  },

  // `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
  gobbleExpression = () => {
    let node, op, left, right, i, curOp, stack=[left=gobbleToken()];

    // if (left==nil) return

    // Deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm) (jsep strip)
    while (curOp = gobbleOp()) {
      // Reduce: make a binary expression from the three topmost entries.
      while (stack.length > 2 && curOp[1] >= stack[stack.length-2][1]) {
        right = stack.pop(), op = stack.pop(), left = stack.pop();
        stack.push(Node(op[0], left, right)); // BINARY_EXP
      }
      if (nil==(node = gobbleToken())) err(`Expected expression after ${curOp[0]} at ${index}`);
      stack.push(curOp, node);
    }

    i = stack.length - 1, node = stack[i];
    while (i > 1) { node = Node(stack[i-1][0], stack[i-2], node), i-=2 } // BINARY_EXP

    return node;
  },

  // `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
  gobbleToken = () => {
      if (x++>1e2) err('Whoops')
    let cc, c, op, node;
    skip(isSpace);

    cc = code(), c = char()

    // `.` can start off a numeric literal
    if (isDigit(cc) || c === '.') node = new Number(gobbleNumber());
    else if (!isNotQuote(cc)) index++, node = new String(gobble(isNotQuote)), index++
    // TODO: these are groups or fn args
    else if (blocks[c]) index++, node = gobbleSequence(blocks[c])
    else if (isIdentifierStart(cc)) node = (node = gobble(isIdentifierPart)) in literals ? literals[node] : node
    // else if (op = gobbleOp(unary)) return nil==(node = gobbleToken()) ? err('missing unaryOp argument') : [op, node];
    else return nil

    return node;
  },

  // `12`, `3.4`, `.5`
  gobbleNumber = () => {
    let number = '', c = char();

    number += gobble(isDigit)
    if (char() === '.') number += expr.charAt(index++) + gobble(isDigit) // .1

    c = char();
    if (c === 'e' || c === 'E') { // exponent marker
      number += c, index++
      c = char();
      if (c === '+' || c === '-') number += c, index++; // exponent sign
      number += gobble(isDigit)
    }

    return number //  LITERAL
  }

  return unlist(gobbleSequence())
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
