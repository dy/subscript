// precedence order
export const operators = {
  '||':(a,b)=>a||b,
  '&&':(a,b)=>a&&b,
  '|':(a,b)=>a|b,
  '^':(a,b)=>a^b,
  '&':(a,b)=>a&b,
  '!=':(a,b)=>a!=b,
  '==':(a,b)=>a==b,
  // ' in ':(a,b)=>a in b,
  '>=':(a,b)=>a>=b,
  '>':(a,b)=>a>b,
  '<=':(a,b)=>a<=b,
  '<':(a,b)=>a<b,
  '>>':(a,b)=>a>>b,
  '<<':(a,b)=>a<<b,
  '+':(a=0,b)=>b+a,
  '-':(a=0,b)=>a-b,
  '%':(a,b)=>a%b,
  '/':(a,b)=>a/b,
  '*':(a,b)=>a*b,
  // '**':(a,b)=>a**b,
  '!':(a,b)=>!b,
  // '~':(a,b)=>~b
  '.':(a,b)=>a[b]
}
// code → calltree
export function parse (seq, ops=operators) {
  let op=[], c, v=[], u=[], g=[''], cur=[0], i, ref

  // ref literals
  seq=seq
    // FIXME: quotes can be parsed via htm method
    // FIXME: number can be detected as \d|.\d - maybe parse linearly too? no need for values...
    // or replace 1.xx with 1d12? (decimal fraction)
    .replace(/"[^"\\\n\r]*"|\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => `#v${v.push(m[0]=='"'?m:parseFloat(m))-1}`)
    // FIXME: can be detected directly in deref
    .replace(/\b(?:true|false|null)\b/g, m => `#v${v.push(m=='null'?null:m=='true')-1}`)
    .replace(/\.(\w+)\b/g, '."$1"') // a.b → a."b" // FIXME: can technically

  // ref groups/unaries
  // FIXME: redundant i, op assignments, g[cur[0]] vs buf
  for (i=0; i < seq.length;) {
    c=seq[i]
    if (c==' '||c=='\r'||c=='\n'||c=='\t') i++
    else if (ops[c=seq[i]+seq[i+1]] || ops[c=seq[i]]) {
      i+=c.length, !op? (op=[], g[cur[0]]+=c) : (g[cur[0]]+=op.unshift(c)<2 ? `${u.push(op)-1}@`:``)
    }
    // a[b][c] → a.#b.#c
    else if (c=='('||c=='[') ref=g.push('')-1, g[cur[0]]+=c=='['?`.#g${ref}`:op?`#g${ref}`:`(#g${ref})`, cur.unshift(ref), op=[], i++
    else if (c==')'||c==']') cur.shift(), op=null, i++
    else g[cur[0]]+=c, op=null, i++
  }

  // split by precedence
  for (op in ops) g = g.map(op=='.'?unp:s=>opx(s,op))

  // unwrap
  const deref = s => {
    let c,un
    if (!s) return null
    if (Array.isArray(s)) return s.map(deref)
    if (~(c=s.indexOf('@'))) un = u[s.slice(0,c)], s = s.slice(c+1)
    if (s[0]=='#') c=s.slice(2), s = s[1]=='v'?v[c]:deref(g[c])
    if (un) s = un.reduce((s,u)=>[u,s],s)
    return s
  }

  return deref(g[0])
}
// FIXME: consolidate these 2 fns into one
// operator groups
const opx = (s, op) => Array.isArray(s) ? [s.shift(), ...s.map(s=>opx(s,op))]
    : s.includes(op) ? [op, ...s.split(op)]
    : s
// call chains
const unp = s => Array.isArray(s) ? [s.shift(), ...s.map(unp)] :
    s.includes('(') ?
    // a(#1).b(#2) → [a,#1,b,#2 → [.,[a,...#1],b],  a(#1)(#2) → [a,#1,,#2 → [[a,...#1],b]
    s.split(/\(|\)/).reduce((a,b,i) => i%2? [opx(a,'.'),b]: b ? ['.',a,...b.slice(1).split('.')] : a)
    : opx(s,'.')
// remove quote
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
