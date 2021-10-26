// precedence order
// FIXME: operators must take full args, not just pair: to directly map lisp constructs [op, ...args], not some reduce shchema
// FIXME: rewrite operators as follows:
export const precedence = [
  ['.', '('],
  '!'
  // ['!','~','+','-','++','--']
  // '**',
  ['*', '/', '%'],
  ['+', '-'],
  ['<<','>>','>>>'],
  ['<','<=','>','>=','in'],
  ['==','!='],
  '&',
  '^',
  '|',
  '&&',
  '||',
  ','
]

export const operators = {
  ',':(a,b)=>b,
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
  // '~':(a,b)=>~b,
  '(':(a,b)=>a(b),
  '.':(a,b)=>a[b]
}

const nil = Symbol('nil')

// code → calltree
export function parse (seq, ops=operators) {
  let op=[], b, c, i, ref, cur=[0], v=[], u=[], g=['']

  // ref literals
  seq=seq
    // FIXME: quotes can be parsed in loop via htm method
    // FIXME: number can be detected as \d|.\d - maybe parse linearly too? no need for values...
    // or replace 1.xx with 1d12? or 1⅒12
    .replace(/"[^"\\\n\r]*"|\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => `#v${v.push(m[0]=='"'?m:parseFloat(m))-1}`)
    // FIXME: can be detected directly in deref
    .replace(/\b(?:true|false|null)\b/g, m => `#v${v.push(m=='null'?null:m=='true')-1}`)
    .replace(/\.(\w+)\b/g, '."$1"') // a.b → a."b" // FIXME: can technically

  // ref groups/unaries
  // FIXME: redundant i, op assignments, g[cur[0]] vs buf
  for (i=0, b=''; i < seq.length;) {
    c=seq[i]
    if (c==' '||c=='\r'||c=='\n'||c=='\t') i++
    else if (ops[c=seq[i]+seq[i+1]] || ops[c=seq[i]]) {
      i+=c.length, !op? (op=[], b+=c) : (b+=op.unshift(c)<2 ? `${u.push(op)-1}@`:``), g[cur[0]]+=b, b=''
    }
    // a[b][c] → a.#b.#c
    // FIXME: seems like we have to create groups here: a(b,c) → [a, b, c], not [apply, a, [',',b,c]] - too much hassle unwrapping it later
    // but we don't have full fn name token a.b.c( here, since . is operator
    // FIXME: it seems my approach is generally misleading: it observes structure and tries to detect patterns
    // whereas practical parsers just follow LTR by some set of rules.
    // We should not detect cases like a(), () - first is possible, the second is not...
    // Also - blank brackets still create empty argument to filter out later
    else if (c=='('||c=='[') {
      ref=g.push('')-1,
      g[cur[0]] += b + (c=='['?`.`:op?``:`(`) + `#g${ref}`
      cur.unshift(ref),
      op=[], i++, b=''
    }
    else if (c==')'||c==']') {
      g[cur[0]] += b, b=''
      cur.shift(), op=null, i++
    }
    else b+=c, op=null, i++
  }
  g[cur[0]]+=b

  // split by precedence
  for (op in ops) g = g.map(op=='.'?unp:s=>opx(s,op))

  // unwrap
  const deref = s => {
    let c,un
    if (Array.isArray(s)) return s
      .map(deref)
      .filter(x=>x!=nil) // [[a,nil]] → [[a]]
      // FIXME: here is a conflict of a(1,2,3) vs +(1,2,3)
      // ? possibly we need to avoid , operator and split , here... but not much difference with whan we have now.
      // ? or split in unp, where we know that a is not an operator... we don't have deref there
      // ? alternatively we combine deref and unp, eg. deref in unp... it's getting messy as if we do something wrong.
      // ? alternatively just drop these attempts to fit calls and directly parse as \w+(.*)
    if (~(c=s.indexOf('@'))) un = u[s.slice(0,c)], s = s.slice(c+1)
    if (s[0]=='#') c=s.slice(2), s = s[1]=='v'?v[c]:!g[c]?nil:deref(g[c])
    if (un) s = un.reduce((s,u)=>[u,s],s)
    return s
  }

  return deref(g[0])
}
// FIXME: consolidate these 2 fns into one
// FIXME: maybe still bring to extensibility?
// operator groups
const opx = (s, op) => Array.isArray(s) ? [s.shift(), ...s.map(s=>opx(s,op))]
    : s.includes(op) ? [op, ...s.split(op)]
    : s
// call chains
const unp = (s) => Array.isArray(s) ? [s.shift(), ...s.map(unp)] :
    s.includes('(') ?
    // a(#1).b(#2) → [a,#1,b,#2 → [.,[a,...#1],b],  a(#1)(#2) → [a,#1,,#2 → [[a,...#1],b]
    s.split(/\(|\)/).reduce((a,b,i) => i%2 ? [opx(a,'.'),b] : b ? ['.',a,...b.slice(1).split('.')] : a)
    : opx(s,'.')
// remove quote
const unq = s => s[0]=='"'?s.slice(1,-1):s

// split by same-precedence ops
export const split = (s, ops) => {
  let cur, op, i=0, i0=0, part
  for (;i<s.length;i++) {
    if (~(c=ops.indexOf(op=s[i]+s[i+1])) || ~(c=ops.indexOf(op=s[i]))) {
      part = s.slice(i0,i),i0=i+op.length
      if (!cur) cur = [op]
      cur.push(part)
      if (op != cur[0]) cur=[op, cur] // 1 + 2 - 3 → [-, [+, 1, 2], 3]   // a.b(c.d) → [[.,a,b],[.,c,d]]
    }
  }
  if (i>i0) cur.push(s.slice(i0,i))
  return cur
}

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
