// precedence order
// FIXME: rewrite operators as follows: (eventually [{.:args=>, (:args=>}, {!:args=>},...])
export const precedence = [
  ['.', '('],
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
]

// operators take full args, not pair
// + directly map calltree nodes [op, ...args], not some reduce shchema
// + that's useful as own lib, like dlv
// + there are shortcuts or extensions for some ops
// + simpler unary handling
// + ternary handling
export const operators = {
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
  '<=':(a,b,c)=>c!=null?(a<=b&&b=<c):(a<=b),
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
  '.':(a,...b)=>b.reduce((a,b)=>a?a[b]:a, a)
}

// FIXME: try to remove
const nil = Symbol('nil')

// code → calltree
export function parse (seq) {
  let op=[], b='', c, i, ref, cur=[], v=[], u=[], g=[''], un=[]

  // ref literals
  seq=seq
    // FIXME: quotes can be parsed in loop via htm method
    // FIXME: number can be detected as \d|.\d - maybe parse linearly too? no need for values...
    // or replace 1.xx with 1d12? or 1⅒12
    .replace(/"[^"\\\n\r]*"|\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => `#v${v.push(m[0]=='"'?m:parseFloat(m))-1}`)
    // FIXME: can be detected directly in deref
    // .replace(/\b(?:true|false|null)\b/g, m => `#v${v.push(m=='null'?null:m=='true')-1}`)
    .replace(/\.(\w+)\b/g, '."$1"') // a.b → a."b"

  // 1. tokenize + groups + unaries: a*+b+(c+d(e)) → [a,*,+,b,+,[(,c,+,d,[(,e,],]]
  // FIXME: a+-(c) is a problem
  const commit = () => b && (cur.push(un.reduce((t,u)=>[u,t], b)), b='', un=[])
  for (i=0; i<seq.length; i++) {
    c = seq[i]
    if (c==' '||c=='\r'||c=='\n'||c=='\t') ;
    else if (c=='('||c=='[') commit() && cur.push(c), cur=[cur] // a(b) → a, (, [ b
    else if (c==')'||c==']') commit(), cur[0].push(cur.length<3?cur[1]: prec(cur.slice(1))), cur=cur[0]
    else if (operators[op=c+seq[++i]]||operators[--i,op=c]) commit() ? cur.push(op) : un.push(op)
    else b+=c
  }
  commit(), cur = prec(cur)
  // TODO: prec must create precedence groups
  console.log(cur)
}

// group seq of tokens into calltree nodes by operator precedence
const prec = (s) => {
  for (let op of precedence) s = s.map(psplit)
  return s
}

const split = (s, ops) => {
  let cur, op, i=1, i0=0
  for (;i<s.length;i+=2) {
    if (~ops.indexOf(op=s[i])) {
      if (!cur) cur = [op]
      cur.push(s[i-1]) // 1+2+3 → [+,1,2,3]
      if (op != cur[0]) cur=[op, cur] // 1+2-3 → [-,[+, 1, 2],3]
    }
    else {
      s.splice()
      cur = null
    }
  }
  return s
}

// calltree → result
export const evaluate = (seq, ctx={}, f,k) => Array.isArray(seq)
// FIXME: possibly we have to reduce not pairs but full args
  ? (f=ctx[seq[0]]||operators[seq[0]], seq=seq.slice(1).map(x=>seq.length<2 ? f(void 0,seq[0]) : seq.reduce(f)))
  : typeof seq === 'string' ? (seq[0] === '"' ? seq.slice(1,-1) : ctx[seq])
  : seq

// code → evaluator
export default (seq) => (seq = typeof seq === 'string' ? parse(seq) : seq, ctx => evaluate(seq, ctx))

