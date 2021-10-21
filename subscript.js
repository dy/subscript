// precedence order
export const operators = {
  '!':(a,b)=>!b,
  // '~':(a,b)=>~b,
  '.':(a,b)=>a[b],
  '⁡':(a,b)=>a(b),
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
  // ':':(a,b)=>a,
  ',':(a,b)=>b,
}
// code → calltree
export function parse (seq, opf=operators) {
  opf[':']=opf[':']||true, opf[',']=opf[',']||true // specials: args, json

  let op=[], c, v=[], u=[], g=[''], cur=[0], opl = Object.keys(opf).reverse(), i, ref

  // ref literals
  seq=seq
    .replace(/"[^"\\\n\r]*"|\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => `#v${v.push(m[0]=='"'?m:parseFloat(m))-1}`)
    .replace(/\b(?:true|false|null)\b/g, m => `#v${v.push(m=='null'?null:m=='true')-1}`)
    .replace(/\.(\w+)\b/g, '."$1"') // a.b → a."b"

  // ref groups/unaries
  for (i=0; i < seq.length;) {
    c=seq[i]
    if (c==' '||c=='\r'||c=='\n'||c=='\t') i++
    else if (opf[c=seq[i]+seq[i+1]] || opf[c=seq[i]]) {
      i+=c.length, !op? (op=[], g[cur[0]]+=c) : (g[cur[0]]+=op.unshift(c)<2 ? `${u.push(op)-1}@`:``)
    }
    else {
      // a[b][c] → a.#b.#c, a(b)(c) → a(#b(#c
      if (c=='('||c=='[') g[cur[0]]+=(op?'':c=='['?'.':'⁡')+`#g${ref=g.push('')-1}`, cur.unshift(ref), op=[]
      else if (c==')'||c==']') cur.shift(), op=null
      else g[cur[0]]+=c, op=null
      i++
    }
  }
console.log(...g)

  // split by precedence
  // FIXME: make a separate function able to process any string
  const oper = (s, l) => Array.isArray(s) ? [s.shift(), ...s.map(oper)] : s.includes(op) ? [op, ...s.split(op)] : s.trim()
  for (op of opl) g = g.map(oper)

  // unwrap
  const deref = (s,c,e,r,i,m,n,a,un,ty,ref,res,args) => {
    // console.group(s)
    if (Array.isArray(s))
      return s[0]=='⁡' ? s.slice(1).reduce((a,b)=>[a, deref(b)]) // [call, name, args1, args2] → [[name, ...args1], ...args2]
        : [s.shift(), ...s.map(deref)]

    if (~(c=s.indexOf('@'))) {
      un = u[s.slice(0,c)]
      s = s.slice(c+1)
    }
    if (s[0]=='#') { // 1, (), [], {}
      ty=s[1], ref=s.slice(2)
      s = ty=='v'?v[ref]:deref(g[ref])
          // :ty=='['?[Array,...deref(g[ref])]
          // :console.log('TODO', ref)
    }
    if (un) s = un.reduce((s,un)=>[un, s],s)
    return s
  }

  return deref(g[0])
}
const unq = s => s[0]=='"'?s.slice(1,-1):s

// calltree → result
export const evaluate = (seq, ctx={}, opf=operators, f,k) => Array.isArray(seq)
// FIXME: possibly we have to reduce non-pairs but full opf
  ? (f=opf[seq[0]]||ctx[seq[0]], seq=seq.slice(1).map(x=>seq.length<2 ? f(void 0,seq[0]) : seq.reduce(f)))
  : typeof seq === 'string' ? (seq[0] === '"' ? seq.slice(1,-1) : ctx[seq])
  : seq

// code → evaluator
export default (seq, opf=operators) => (
  seq = typeof seq === 'string' ? parse(seq, opf) : seq,
  ctx => evaluate(seq, ctx, opf)
)

const dprop = (obj, key)=> key.split('.').reduce((a,b)=>b?a?.[b]:a, obj)
