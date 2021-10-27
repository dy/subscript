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
  '.':(a,...b)=>b.reduce((a,b)=>a?a[b]:a, a)
}

// FIXME: try to remove
const nil = Symbol('nil')

const lit = {true:true, false:false, null:null, undefined:undefined}

// code → calltree
export function parse (seq) {
  let op=[], b='', c, i, br, cur=[], v=[], un=[]

  // ref tokens
  seq=seq
    .replace(/\.(\w+)\b/g, m => `.#${v.push(`"${m}"`)-1}`) // a.b → a.#2
    .replace(/\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => `#${v.push(parseFloat(m))-1}`) // .75e-12 → #1
console.log(seq)
  // 1. tokenize + groups + unaries: a*+b+(c+d(e)) → [a,*,+,b,+,[(,c,+,d,[(,e,],]]
  // FIXME: a+-(c) is a problem
  const commit = () => b && (cur.push(
    un.reduce(
      (t,u)=>[u,t],
      b[0]=='#' ? v[b.slice(1)] : lit[b] || b
    )
  ), b='', un=[])

  for (i=0; i<seq.length; i++) {
    c = seq[i]
    if (br) b+=c, br==c && (br='');
    else if (c==' '||c=='\r'||c=='\n'||c=='\t') ;
    else if (c=='"'||c=="'") b+=br=c
    else if (c=='('||c=='[') commit() && cur.push(c), cur=[cur] // a(b) → a, (, [ b
    else if (c==')'||c==']') commit(), cur[0].push(cur.length<3?cur[1]: prec(cur.slice(1))), cur=cur[0]
    else if (operators[op=c+seq[++i]]||operators[--i,op=c]) commit() ? cur.push(op) : un.push(op)
    else b+=c
  }
  commit()
  console.log(cur)

  cur = prec(cur)

  return cur
}

// group seq of tokens into calltree nodes by operator precedence
const prec = (s) => {
  for (let ops of precedence) {
    // console.group(ops)
    let cur, res=[], op, i=1
    for (;i<s.length;i+=2) {
      if (~ops.indexOf(op=s[i])) {
        // console.log('op found', op)
        if (!cur) cur = [op]
        cur.push(s[i-1])
        if (op != cur[0]) cur=[op, cur], console.log(cur)
      }
      else if (cur) cur.push(s[i-1]), res.push(cur, s[i]), cur=null
      else res.push(s[i-1], s[i])
    }
    if (cur) cur.push(s[i-1]), res.push(cur)
    else res.push(s[i-1])
    s = res
    // console.log(res)
    // console.groupEnd()
  }
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

