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
export function parse (seq, od=operators) {
  let op, c, v=[], g=[seq], u=[],
    ops = Object.keys(od).reverse(),
    og = ops.map(o=>o.replace(/./g,'\\$&')).join('|'),
    ore = new RegExp(`(^|${og})(${og})(${og})?`,'g')

  // literals
  g[0]=g[0]
    .replace(/"[^"\\\n\r]*"|\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => `#v${v.push(m[0]==='"'?m:parseFloat(m))-1}`)
    .replace(/\b(?:true|false|null)\b/g, m => `#v${v.push(m=='null'?null:m=='true')-1}`)
    .replace(/\s+/g,'')
    .replace(ore, (m,o0,o1,o2) => `${o0}${u.push(o2?[o2,o1]:[o1])-1}@`) // up to 2 unary ops

  // groups
  while(g.length!=c) c=g.length, g[0]=g[0]
    .replace(/\(([^\)\]]*)\)/g, (m,c)=>`#g${g.push(c)-1}`)
    .replace(/\[([^\]\)]*)\]/g, (m,c)=>`#p${g.push(c)-1}`)

  // binaries w/precedence
  const oper = (s, l) => Array.isArray(s) ? [s.shift(), ...s.map(oper)]
    : s.includes(op) && (l=s.split(op)).length > 1 ? [op, ...l] : s
  for (op of ops) g=g.map(oper)

  // unwrap
  const deref = (s,c,r,i,m,n,un,uop) => Array.isArray(s) ? [s.shift(), ...s.map(deref)]
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
