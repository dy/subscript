const isDigit = c => c >= 48 && c <= 57, // 0...9,
  isIdentifierStart = c => (c >= 65 && c <= 90) || // A...Z
      (c >= 97 && c <= 122) || // a...z
      (c == 36 || c == 95) || // $, _,
      c >= 192, // any non-ASCII
  isIdentifierPart = c => isIdentifierStart(c) || isDigit(c),
  isSpace = c => c <= 32,
  isNotQuote = c => !quotes[String.fromCharCode(c)],

  oper = (op, ops=binary, i, c=0) => { for (i=ops.length;i--;) if (ops[i][op]) return i+1 }, // get precedence
  isCmd = (a,op) => Array.isArray(a) && a.length && a[0] && (op ? a[0]===op : typeof a[0] === 'string' || isCmd(a[0])), // is calltree node

  // it's not comfortable to detect internal literals in evaluator, like Array, String, Number, Bool, null, etc.
  // so on parsing stage we wrap them into objects and save raw values here
  lits = new WeakMap(),
  lit = (k,v=k) => (lits.set(k,v),k),
  unseq = l => l.length<2?l[0]:l,

  Err = e => {throw new Error(e)}

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

// binaries take multiple args because
// + that allows shortcuts
// + that's lisp/frisk compatible
// + that allows simpler manual evaluator calls
// + functions anyways take multiple arguments
binary = [
  {'||':(...a)=>a.some(Boolean)},
  {'&&':(...a)=>a.every(Boolean)},
  {'|':(a,b)=>a|b},
  {'^':(a,b)=>a^b},
  {'&':(a,b)=>a&b},
  {
    '!=':(a,b)=>a!=b,
    '==':(a,b)=>a==b,
  },
  {
    '>=':(a,b)=>a>=b,
    '>':(a,b)=>a>b,
    '<=':(a,b)=>a<=b,
    '<':(a,b)=>a<b,
  },
  {
    '>>>':(a,b)=>a>>>b,
    '>>':(a,b)=>a>>b,
    '<<':(a,b)=>a<<b,
  },
  {
    '+':(...a)=>a.reduce((a,b)=>a+b),
    '-':(...a)=>a.reduce((a,b)=>a-b),
  },
  {
    '%':(...a)=>a.reduce((a,b)=>a%b),
    '/':(...a)=>a.reduce((a,b)=>a/b),
    '*':(...a)=>a.reduce((a,b)=>a*b),
  },
  {
    '.':(...a)=>a.reduce((a,b)=>a?a[b]:a)
  }
],

transforms = {
  // Array literal
  // Object literal
  // Ternary
  // [(, a] → a, [(,a,''] → [a], [(,a,[',',b,c],d] → [[a,b,c],d]
  '(': s => s.length < 3 ? s[1] : s // : s.slice(1).reduce((a,b)=>[a].concat(!b?[]:b[0]==','?b.slice(1):[b])),
  // '.': s => [s[0],s[1], ...s.slice(2).map(a=>typeof a === 'string' ? `"${a}"` : a)] // [.,a,b → [.,a,'"b"'
},
transform = (n, t) => (t = isCmd(n)&&transforms[n[0]], t?t(n):n),


parse = (expr, index=0, len=expr.length) => {
  const char = () => expr.charAt(index),
  code = () => expr.charCodeAt(index),
  err = message => Err(message + ' at character ' + index),

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

  gobbleOp = (ops=binary, op, l=3) => {
    skip(isSpace);
    while (!oper(op=expr.substr(index, l--),ops)) if (!l) return
    index+=op.length
    return op
  },

  // `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
  gobbleExpression = () => {
    let node, op, prec, stack, op_info, left, right, i, curOp;

    if (!(left = gobbleToken())) return;
    if (!(op = gobbleOp())) return left;
    if (!(right = gobbleToken())) err("Expected expression after " + op);

    // Otherwise, start a stack to properly place the binary operations in their precedence structure
    stack = [left, [ op, oper(op)||0 ], right];

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    // Stripped from jsep, not much mind given optimizing, but good enough
    while ((curOp = gobbleOp()) && (prec = oper(curOp))) {
      // Reduce: make a binary expression from the three topmost entries.
      while ((stack.length > 2) && stack[stack.length-2][1] >= prec) {
        right = stack.pop(), op = stack.pop()[0], left = stack.pop();
        stack.push([op, left, right]); // BINARY_EXP
      }
      node = gobbleToken(); if (!node) err("Expected expression after " + curOp);
      stack.push([curOp, prec], node);
    }

    i = stack.length - 1, node = stack[i];
    while (i > 1) { node = [stack[i-1][0], stack[i-2], node], i-=2 } // BINARY_EXP

    return node;
  },

  // `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)`
  gobbleToken = () => {
    let cc, c, op, node;
    skip(isSpace);

    cc = code(), c = char()

    // Char code 46 is a dot `.` which can start off a numeric literal
    if (isDigit(cc) || c === '.') lit(node = new Number(gobbleNumber()), +node);
    else if (!isNotQuote(cc)) index++, node = gobble(isNotQuote), node = lit(new String(node), node), index++ // string literal
    else if (blocks[c]) index++, node = transform([c, ...gobbleSequence(blocks[c])])
    // else if (cc === OBRACK) index++, node = ['[',...gobbleSequence(CBRACK)] // array
    // else if (cc === OPAREN) index++, node = [,...gobbleSequence(CPAREN)] // group
    // else if (cc === OBRACK) index++, node = lit(gobbleSequence(CBRACK)) // array
    // else if (cc === OPAREN) index++, node = gobbleSequence(CPAREN) // group
    else if (isIdentifierStart(cc))
      node = gobble(isIdentifierPart), node = node in literals ? lit(Object(node=literals[node]),node) : node; // LITERAL
    // else if (isIdentifierStart(cc)) {if ((node = gobble(isIdentifierPart)) in literals) return node} // LITERAL
    else if (op = gobbleOp(unary)) {
      if (!(node = gobbleToken())) err('missing unaryOp argument');
      return [op, node] // UNARY_EXP
    }
    if (!node) return

    // a.b[c](d)
    // FIXME: that's heuristic of more generic something, like transform
    // FIXME: optimize condition
    while (skip(isSpace), c=char(), c === '.' || c === '[' || c === '(') {
      index++, skip(isSpace)
      if (c === '[') (node = isCmd(node, '.')?node:['.',node]).push(unseq(gobbleSequence(']'))) // MEMBER_EXP
      else if (c === '(') node = [node, ...gobbleSequence(')')] // CALL_EXP
      else if (c === '.') (node = isCmd(node, '.')?node:['.',node]).push(gobble(isIdentifierPart)) // MEMBER_EXP
    }

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

  return unseq(gobbleSequence())
},

// calltree → result
evaluate = (s, ctx={}, c) =>
  lits.has(s) ? lits.get(s) :
  isCmd(s) ?
    (c=s[0], isCmd(c) ? evaluate(c, ctx) : ctx[c] || (s.length<3?unary:binary).find(op => op[c]) || Err('Unknown comand ' + c))
    (...s.map(a=>evaluate(a,ctx))) :
  s&&typeof s === 'string' ?
    s[0] === '@' ? s.slice(1) : // frisk-compat
    quotes[s[0]] ? s.slice(1,-1) : // manual literal '"abc"'
    ctx[s] :
  s

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s,  ctx => evaluate(s, ctx))
