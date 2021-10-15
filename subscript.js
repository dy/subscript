// precedence order
export const operators = {
  '!':(a,b)=>!a,
  '~':(a,b)=>~a,
  '.':(a,b)=>a[b],
  '**':(a,b)=>a**b,
  '*':(a,b)=>a*b,
  '/':(a,b)=>a/b,
  '%':(a,b)=>a%b,
  '-':(a=0,b)=>a-b,
  '+':(a=0,b)=>a+b,
  '<<':(a,b)=>a<<b,
  '>>':(a,b)=>a>>b,
  '<':(a,b)=>a<b,
  '<=':(a,b)=>a<=b,
  '>':(a,b)=>a>b,
  '>=':(a,b)=>a>=b,
  'in':(a,b)=>a in b,
  '==':(a,b)=>a==b,
  '!=':(a,b)=>a!=b,
  '&':(a,b)=>a&b,
  '^':(a,b)=>a^b,
  '|':(a,b)=>a|b,
  '&&':(a,b)=>a&&b,
  '||':(a,b)=>a||b,
  ',':(a,b)=>b,
}

// code → lispy tree
export function parse (seq, ops=operators) {
  let op, c, v=[], g=[''], u=[], ord = Object.keys(ops).reverse(), uop=[], i=0

  // literals
  seq=seq
    .replace(/"[^"\\\n\r]*"|\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => `#v${v.push(m[0]==='"'?m:parseFloat(m))-1}`)
    .replace(/\b(?:true|false|null)\b/g, m => `#v${v.push(m=='null'?null:m=='true')-1}`)
    .replace(/\s+/g,'')

  // unaries
  for (; i < seq.length; g[0]+=c) {
    // c = seq[i]
    if (ops[c=seq[i]+seq[i+1]] || ops[c=seq[i]]) {
      i+=c.length, uop ? (uop.unshift(c), c='') : (uop = [])
    }
    else {
      if (uop?.length) g[0] += `${u.push(uop)-1}@`
      uop = null, i++
    }
  }

  // groups
  while(g.length!=c) c=g.length, g[0]=g[0]
    .replace(/\(([^\)\]]*)\)/g, (m,c)=>`#g${g.push(c)-1}`)
    .replace(/\[([^\]\)]*)\]/g, (m,c)=>`#p${g.push(c)-1}`)

  // binaries w/precedence
  const oper = (s, l) => Array.isArray(s) ? [s.shift(), ...s.map(oper)]
    : s.includes(op) && (l=s.split(op)).length > 1 ? [op, ...l] : s
  for (op of ord) g=g.map(oper)

  // unwrap
  const deref = (s,c,r,i,m,n,un) => Array.isArray(s) ? [s.shift(), ...s.map(deref)]
    : ~(c = s.indexOf('#')) ? (
      i = s.slice(c+2), m=s[c+1], r= m=='v'?v[i]:deref(g[i]),
      n=s.slice(un=s.indexOf('@')+1, c),
      r = m == 'g' ? (c ? [n,r] : r) // fn call or group
      : m == 'p' ? ['.',n,r] // property
      : r, // id
      r = un ? u[s.slice(0,un-1)].reduce((r,op)=>[op, r],r) : r // unary op
    )
    : s

  return deref(g[0])
}

// code → evaluator
export default function (seq, ops=operators) {
  if (typeof seq === 'string') seq = parse(seq,ops)

  const evaluate = seq => Array.isArray(seq)
    ? seq.slice(1).map(evaluate).reduce(ops[seq[0]] || ctx[seq[0]])
    : typeof seq === 'string' ? (seq[0] === '"' ? seq.slice(1,-1) : ctx[seq])
    : seq

  return ctx => evaluate(seq, ctx)
}
