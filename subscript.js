// precedence order
// FIXME: rewrite operators as follows: (eventually [{.:args=>, (:args=>}, {!:args=>},...])
export const precedence = [
  ['.', '(', '['],
  '!',
  // '**',
  // ['!','~','+','-','++','--']
  ['*', '/', '%'],
  ['+', '-'],
  ['<<','>>','>>>'],
  ['<','<=','>','>=','in'],
  ['==','!='],
  '&',
  '^',
  '|',
  ['&&'],
  ['||'],
  ','
],

// operators take full args, not pair
// + directly map calltree nodes [op, ...args], not some reduce shchema
// + that's useful as own lib, like dlv
// + there are shortcuts or extensions for some ops
// + simpler unary handling
// + ternary handling
operators = {
  ',':(a,...b)=>b[b.length-1],
  '||':(...a)=>a.some(a=>a),
  '&&':(...a)=>a.every(a=>a),
  '|':(a,b)=>a|b,
  '^':(a,b)=>a^b,
  '&':(a,b)=>a&b,
  '!=':(a,b)=>a!=b,
  '==':(a,b)=>a==b,
  // ' in ':(a,b)=>a in b,
  '>=':(a,b,c)=>c!=null?(a>=b&&b>=c):(a>=b),
  '>':(a,b,c)=>c!=null?(a>b&&b>c):(a>b),
  '<=':(a,b,c)=>c!=null?(a<=b&&b<=c):(a<=b),
  '<':(a,b,c)=>c!=null?(a<b&&b<c):(a<b),
  '>>':(a,b)=>a>>b,
  '<<':(a,b)=>a<<b,
  '+':(...b)=>a.reduce((a,b)=>a+b),
  '-':(...b)=>a.reduce((a,b)=>a-b),
  '%':(...a)=>a.reduce((a,b)=>a%b),
  '/':(...a)=>a.reduce((a,b)=>a/b),
  '*':(...a)=>a.reduce((a,b)=>a*b),
  // '**':(a,b)=>a**b,
  '!':(a)=>!a,
  // '~':(a)=>~a,
  '(':(a,...args)=>a(...args),
  '[':(a,...b)=>b.reduce((a,b)=>a?a[b]:a, a),
  '.':(a,...b)=>b.reduce((a,b)=>a?a[b]:a, a)
},

literal = {true:true, false:false, null:null, undefined:undefined}

// code → calltree
export function parse (seq) {
  let op=[], b='', c, i, cur=[null], v=[], un=[]

  // ref literals
  seq=seq
    .replace(/"[^"\\\n\r]*"/g, m => `#v${v.push(m)-1}`) // "a" → #0; in loop would be too late
    .replace(/\d*\.\d+(?:[eE][+\-]?\d+)?|\b\d+/g, m => `#v${v.push(parseFloat(m))-1}`) // .75e-12 → #1
    .replace(/\.(\w+)\b/g, `."$1"`) // a.b → a."b"

  // tokenize + groups + unaries: a*+b+(c+d(e)) → [a,*,[+,b],+,(,[c,+,d,(,[e],]]
  // FIXME: a+-(c) is a problem
  const commit = () => b && (cur.push(un.reduce((t,u)=>[u,t],  b[0]=='#' ? v[b.slice(2)] : literal[b] || b)), b='', un=[])

  for (i=0; i<seq.length; i++) {
    c = seq[i]
    if (c==' '||c=='\r'||c=='\n'||c=='\t') ;
    else if (c=='('||c=='[') commit(), !(cur.length%2) && cur.push(c), cur=[cur] // `a(b)`→`a,(,[b`; `a)(b)`→`a],(,[b`; `a[b`→`a,.,b`
    else if (c==')'||c==']') commit(), cur[0].push(prec(cur.slice(1))), cur=cur[0]
    else if (operators[op=c+seq[++i]]||operators[--i,op=c]) commit(), !(cur.length%2) ? cur.push(op) : un.push(op)
    else b+=c
  }
    console.log(cur)

  // commit()
  // cur = prec(cur.slice(1))

  return cur
}

// group seq of tokens into calltree nodes by operator precedence
const prec = (s) => {
  if (!s.length) return ''
  let cur, res, op, i, ops

  const commit = () => cur ? (
    cur.push(s[i-1]), res.push(cur), cur=null
  ) : res.push(s[i-1])

  precedence.forEach((ops,p)=> {
    // console.group(ops, s)
    res=[], i=1
    for (;i<s.length;i+=2) {
      if (~ops.indexOf(op=s[i])) {
        // console.log('op found', op)
        if (!cur) cur = [op]
        cur.push(s[i-1])
        if (op != cur[0]) cur=[op, cur]
      }
      else commit(), res.push(s[i])
    }
    commit()
    s = p ? res
      // fix call op: [(,a,[',',b,c],d] → [[a, b, c],c],  [(,a,''] → [a]
      : res.map(s => s&&s[0] == '(' ? s.slice(1).reduce((a,b)=>[a].concat(!b?[]:b[0]==','?b.slice(1):[b])) : s)
  })

  return s.length>1?s:s[0]
}

// calltree → result
export const evaluate = (seq, ctx={}, f,k) => Array.isArray(seq)
// FIXME: possibly we have to reduce not pairs but full args
  ? (f=ctx[seq[0]]||operators[seq[0]], seq=seq.slice(1).map(x=>seq.length<2 ? f(void 0,seq[0]) : seq.reduce(f)))
  : typeof seq === 'string' ? (seq[0] === '"' ? seq.slice(1,-1) : ctx[seq])
  : seq

// code → evaluator
export default (seq) => (seq = typeof seq === 'string' ? parse(seq) : seq, ctx => evaluate(seq, ctx))

