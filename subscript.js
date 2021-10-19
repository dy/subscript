// precedence order
export const operators = {
  '!':(a,b)=>!b,
  // '~':(a,b)=>~b,
  // '.':(a,b)=>console.log(a,b)||a[b], // TODO: meld in code
  // '.':(a,b)=>console.log(a,b)||b?a?.[b]:b,
  // '{':(a,b)=>console.log(a,b),
  // '**':(a,b)=>a**b,
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
  // ' in ':(a,b)=>a in b,
  '==':(a,b)=>a==b,
  '!=':(a,b)=>a!=b,
  '&':(a,b)=>a&b,
  '^':(a,b)=>a^b,
  '|':(a,b)=>a|b,
  '&&':(a,b)=>a&&b,
  '||':(a,b)=>a||b,
  ':':(a,b)=>a, // for JSON (!keyed arrays?)
  ',':(a,b)=>b,
}

// code → lispy tree
export function parse (seq, opf=operators) {
  let op=[], b, c, v=[], u=[], g=[''], cur=[0], opl = Object.keys(opf).reverse(), i

  // ref literals
  seq=seq
    .replace(/"[^"\\\n\r]*"|\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => `#v${v.push(m[0]==='"'?m:parseFloat(m))-1}`)
    .replace(/\b(?:true|false|null)\b/g, m => `#v${v.push(m=='null'?null:m=='true')-1}`)
    // .replace(/\s+/g,'')

  // ref groups/unaries
  for (i=0; i < seq.length;) {
    c=seq[i]
    if (c==' '||c=='\r'||c=='\n'||c=='\t') i++
    else if (opf[c=seq[i]+seq[i+1]] || opf[c=seq[i]]) {
      i+=c.length, !op? (op=[], g[cur[0]]+=c) : (g[cur[0]]+=op.unshift(c)<2 ? `${u.push(op)-1}@`:``)
    }
    else {
      if (op?.length) op=null
      if (c=='('||c=='['||c=='{') g[cur[0]]+=`#${c}${cur.unshift(g.push('')-1)}`, op=[]
      else if (c==')'||c==']'||c=='}') cur.shift()
      else g[cur[0]]+=c, op=null
      i++
    }
  }

  // binaries w/precedence
  // FIXME: create tree instead of groups, convert opf in-place
  const oper = (s, l) => Array.isArray(s) ? [s.shift(), ...s.map(oper)] : s.includes(op) ? [op, ...s.split(op)] : s.trim()
  for (op of opl) g = g.map(oper)

  // unwrap
  const deref = (s,c,e,r,i,m,n,ui,a,uop) => {
    if (Array.isArray(s)) return [s.shift(), ...s.map(deref)]
    if (~(ui=s.indexOf('@'))) {
      uop = u[s.slice(0,ui)]
      s = s.slice(ui+1)
    }
    while (s[0]=='#') {
      m = s[1]
      s = s.slice(2)
      if (m=='v') s=v[s]
    }
    if (uop) s = uop.reduce((s,uop)=>[uop, s],s)
    // ~(c = s.indexOf('#')) ? (
    //   e=s.indexOf('#',c+2), e = ~e?e:s.length,
    //   i = s.slice(c+2,e), m=s[c+1],
    //   n=s.slice(un=s.indexOf('@')+1, c),
    //   // k=s.substr(0,  s.indexOf(':')),
    //   r = m=='v' ? console.log(s,c)||v[i]
    //     // : m == 'g' ? (a=deref(g[i]), c ? [n,a] : a) // fn call or group
    //     // : m == 'p' ? (a=deref(g[i]), c ? ['[',n,a] : a) // property or array
    //     // : m == 'o' ? !g[i]?{}:(a=g[i][0]==':'?[g[i]]:g[i].slice(1), Object.fromEntries(a.map(x=>[unq(deref(x[1])),deref(x[2])])))
    //     : r, // id
    //   r = un ? u[s.slice(0,un-1)].reduce((r,op)=>[op, r],r) : r // unary op
    // )
    return s
  }

  return deref(g[0])
}
const unq = s => s[0]=='"'?s.slice(1,-1):s

// tree → result
export const evaluate = (seq, ctx={}, opf=operators, f,k) => Array.isArray(seq)
// FIXME: possibly we have to reduce non-pairs but full opf
  ? (f=opf[seq[0]]||ctx[seq[0]],seq=seq.slice(1).map(x=>console.log(x,evaluate(x,ctx,opf))||evaluate(x,ctx,opf)), seq.length<2 ? f(void 0,seq[0]) : seq.reduce(f))
  : typeof seq === 'string' ? (seq[0] === '"' ? seq.slice(1,-1) : ctx[seq])
  : seq

// code → evaluator
export default (seq, opf=operators) => (
  seq = typeof seq === 'string' ? parse(seq, opf) : seq,
  ctx => evaluate(seq, ctx, opf)
)

const dprop = (obj, key)=> key.split('.').reduce((a,b)=>b?a?.[b]:a, obj)
