// precedence order
// FIXME: rewrite operators as follows: (eventually [{.:args=>, (:args=>}, {!:args=>},...])
export const precedence = [
  ',',
  '||',
  '&&',
  '|',
  '^',
  '&',
  ['==','!='],
  ['<','<=','>','>=','in'],
  ['<<','>>','>>>'],
  ['+', '-'],
  ['*', '/', '%'],
  // '**',
  // ['!','~','+','-','++','--']
  '!',
  ['.', '('],
]

// FIXME: operators must take full args, not just pair: to directly map lisp constructs [op, ...args], not some reduce shchema
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
export function parse (seq) {
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

  // ref groups
  // FIXME: redundant i, op assignments, g[cur[0]] vs buf
  for (i=0, b=''; i < seq.length;) {
    c=seq[i]
    if (c==' '||c=='\r'||c=='\n'||c=='\t') i++
    // a[b][c] → a.#b.#c
    // FIXME: seems like we have to create groups here: a(b,c) → [a, b, c], not [apply, a, [',',b,c]] - too much hassle unwrapping it later
    // FIXME: is it possible to enable recursion somehow? seems like group refs could be solved simpler
    // FIXME: ideally we'd merge it with psplit: make this first run is for (, [, . operators and call psplit from within, not after
    else if (c=='('||c=='[') {
      ref=g.push('')-1,
      g[cur[0]] += b + (c=='['?`.`: /\w$/.test(b) ?`(`:``) + `#g${ref}` // FIXME: this is redundant regex that's algorithm defect
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
  for (op of precedence) g = g.map(s=>psplit(s,op))

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
    if (s[0]=='#') c=s.slice(2), s = s[1]=='v'?v[c]:!g[c]?nil:deref(g[c])
    if (un) s = un.reduce((s,u)=>[u,s],s)
    return s
  }

  return deref(g[0])
}
// FIXME: maybe still bring to extensibility?
// split by precedence
const psplit = (s, ops) => {
  if (Array.isArray(s)) return [s.shift(), ...s.map(s=>psplit(s,ops))]

  let cur, op, un=[], i=0, i0=0, tok, c
  for (;i<s.length;i++) {
    if (~(c=ops.indexOf(op=s[i]+s[i+1])) || ~(c=ops.indexOf(op=s[i]))) {
      if (i>i0) {
        if (!cur) cur = [op]
        cur.push(un.reduce((t,u)=>[u,t], s.slice(i0,i))) // 1 + 2 + 3 → [+,1,2,3]
        un = []
        if (op != cur[0]) cur=[op, cur] // 1 + 2 - 3 → [-, [+, 1, 2], 3]
      }
      else un.push(op)
      i0=i+op.length
    }
  }
  if (!cur) return s
  // FIXME: it there a way to remove duplicate
  if (i>i0) cur.push(un.reduce((t,u)=>[u,t], s.slice(i0,i)))
  return cur
}

// calltree → result
export const evaluate = (seq, ctx={}, f,k) => Array.isArray(seq)
// FIXME: possibly we have to reduce non-pairs but full opf
  ? (f=operators[seq[0]]||ctx[seq[0]], seq=seq.slice(1).map(x=>seq.length<2 ? f(void 0,seq[0]) : seq.reduce(f)))
  : typeof seq === 'string' ? (seq[0] === '"' ? seq.slice(1,-1) : ctx[seq])
  : seq

// code → evaluator
export default (seq) => (seq = typeof seq === 'string' ? parse(seq) : seq, ctx => evaluate(seq, ctx))

// // operator groups
// const opx = (s, op) => Array.isArray(s) ? [s.shift(), ...s.map(s=>opx(s,op))]
//     : s.includes(op) ? [op, ...s.split(op)]
//     : s

// const dprop = (obj, key)=> key.split('.').reduce((a,b)=>b?a?.[b]:a, obj)

// // call chains
// const unp = (s) => Array.isArray(s) ? [s.shift(), ...s.map(unp)] :
//     s.includes('(') ?
//     // a(#1).b(#2) → [a,#1,b,#2 → [.,[a,...#1],b],  a(#1)(#2) → [a,#1,,#2 → [[a,...#1],b]
//     s.split(/\(|\)/).reduce((a,b,i) => i%2 ? [opx(a,'.'),b] : b ? ['.',a,...b.slice(1).split('.')] : a)
//     : opx(s,'.')
// // remove quote
// const unq = s => s[0]=='"'?s.slice(1,-1):s
