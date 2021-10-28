// precedence order
// FIXME: rewrite operators as follows: (eventually [{.:args=>, (:args=>}, {!:args=>},...])
export const precedence = [
  // FIXME: is that posible to generalize algo, to detect ternaries/brackets declaratively?
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
export function parse (s) {
  let i=0

  const tokenize = (op, b='', n, q, c, cur=[], un=[]) => {
    const commit = (v, op) => {
      if (v) cur.push(un.reduceRight((t,u)=>[u,t], n ? parseFloat(v) : v in literal ? literal[v] : v)), un=[]
      if (op) (cur.length%2 ? cur : un).push(op)
      n=b=c=''
    }

    for (; i<=s.length; b+=c) {
      c = s[i++]
      if (q && c==q) q=''
      else if (n && (c=='e'||c=='E')) c+=s[i++]
      else if (c==' '||c=='\r'||c=='\n'||c=='\t') c=''
      else if (c=='"'||c=="'") q=c
      else if (!b && c>='0' && c<='9' || c=='.' && s[i]>='0' && s[i]<='9') n=1
      else if (c=='('||c=='[') commit(b, c), commit(tokenize())
      else if (!c||c==')'||c==']') return commit(b), group(cur)
      else if (operators[op=c+s[i]]||operators[op=c]) commit(b, op)
    }
  }

  s=tokenize(s)
  // console.log(s)

  return s
}

// group seq of tokens into calltree nodes by operator precedence
const group = (s) => {
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

