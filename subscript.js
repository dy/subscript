// precedence order
export const operators = {
  '!':(a,b)=>!b,
  '~':(a,b)=>~b,
  // '.':(a,b)=>console.log(a,b)||a[b], // TODO: meld in code
  '[':(a,b)=>a[b],
  '{':(a,b)=>console.log(a,b),
  '**':(a,b)=>a**b,
  '*':(a,b)=>a*b,
  '/':(a,b)=>a/b,
  '%':(a,b)=>a%b,
  '-':(a=0,b)=>a-b,
  '+':(a=0,b)=>b+a,
  '<<':(a,b)=>a<<b,
  '>>':(a,b)=>a>>b,
  '<':(a,b)=>a<b,
  '<=':(a,b)=>a<=b,
  '>':(a,b)=>a>b,
  '>=':(a,b)=>a>=b,
  ' in ':(a,b)=>a in b,
  '==':(a,b)=>a==b,
  '!=':(a,b)=>a!=b,
  '&':(a,b)=>a&b,
  '^':(a,b)=>a^b,
  '|':(a,b)=>a|b,
  '&&':(a,b)=>a&&b,
  '||':(a,b)=>a||b,
  ':':(a,b)=>a,
  ',':(a,b)=>b,
}

// code → lispy tree
export function parse (seq, ops=operators) {
  let op, c, v=[], g=[''], u=[], ord = Object.keys(ops).reverse(), uop=[], i, res

  // literals
  g[0]=seq
    .replace(/"[^"\\\n\r]*"|\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => `#v${v.push(m[0]==='"'?m:parseFloat(m))-1}`)
    .replace(/\b(?:true|false|null)\b/g, m => `#v${v.push(m=='null'?null:m=='true')-1}`)
    .replace(/\s+/g,'')

  // groups
  while(g.length!=c) c=g.length, g[0]=g[0]
    .replace(/\(([^\)\]\}]*)\)/g, (m,c)=>`#g${g.push(c)-1}`)
    .replace(/\[([^\]\)\}]*)\]/g, (m,c)=>`#p${g.push(c)-1}`)
    .replace(/\{([^\]\)\}]*)\}/g, (m,c)=>`#o${g.push(c)-1}`)

  // unaries
  g=g.map(seq=>{
    for (i=0, res=''; i < seq.length; res+=c) {
      if (ops[c=seq[i]+seq[i+1]] || ops[c=seq[i]]) {
        i+=c.length, uop ? (uop.unshift(c), c='') : (uop = [])
      }
      else {
        if (uop?.length) res += `${u.push(uop)-1}@`
        uop = null, i++
      }
    }
    return res
  })

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
      : m == 'p' ? (c ? ['[',n,r] : r) // property or array
      : m == 'o' ? console.log(r)||['{',r]
      : r, // id
      r = un ? u[s.slice(0,un-1)].reduce((r,op)=>[op, r],r) : r // unary op
    )
    : s

  return deref(g[0])
}

// tree → result
export const evaluate = (seq, ctx={}, ops=operators, f,k) => Array.isArray(seq)
  ? (f=ops[seq[0]] || dprop(ctx, seq[0]),seq=seq.slice(1).map(x=>evaluate(x,ctx,ops)), seq.length<2 ? f(void 0,seq[0]) : seq.reduce(f))
  : typeof seq === 'string' ? (seq[0] === '"' ? seq.slice(1,-1) : dprop(ctx,seq))
  : seq

// code → evaluator
export default (seq, ops=operators) => (
  seq = typeof seq === 'string' ? parse(seq, ops) : seq,
  ctx => evaluate(seq, ctx, ops)
)

const dprop = (obj, key)=> key.split('.').reduce((a,b)=>b?a?.[b]:a, obj)
