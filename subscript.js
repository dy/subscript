// precedence order
export const operators = {
  '!':(a,b)=>!b,
  '~':(a,b)=>~b,
  // '.':(a,b)=>console.log(a,b)||a[b], // TODO: meld in code
  '.':(a,b)=>console.log(a,b)||b?a?.[b]:b,
  // '{':(a,b)=>console.log(a,b),
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
  ':':(a,b)=>a, // for JSON (!keyed arrays?)
  ',':(a,b)=>b,
}

const br={'(':')','[':']','{':'}'}

// code → lispy tree
export function parse (seq, ops=operators) {
  let op, c, v=[], u=[], opl = Object.keys(ops).reverse(), uop=[], i, res, cur = [], up, buf=''

  // literals
  seq=seq
    .replace(/"[^"\\\n\r]*"|\b\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?\b/g, m => `#v${v.push(m[0]==='"'?m:parseFloat(m))-1}`)
    .replace(/\b(?:true|false|null)\b/g, m => `#v${v.push(m=='null'?null:m=='true')-1}`)
    // .replace(/\s+/g,'')

  // groups
  // FIXME: merge with unaries loop; create tree straight ahead
  for (i=0; i < seq.length;) {
    c=seq[i]
    if (c=='\s'||c=='\r'||c=='\n'||c=='\t') i++, buf+=c
    else if (ops[c=seq[i]+seq[i+1]] || ops[c=seq[i]]) {
      i+=c.length, uop ? uop.unshift(c) : (uop = [], buf+=c)
    }
    else {
      if (uop?.length) buf += `${u.push(uop)-1}@`
      uop = null, i++
      if (c=='('||c=='['||c=='{') { //group, call, array, prop, obj
        if (buf) cur.push(buf), buf='';
        (up=cur).push(cur=[c]), cur.up=up
      }
      else if (br[cur[0]]==c) {
        if (buf) cur.push(buf), buf=''
        cur=cur.up
      }
      else buf += c
    }
  }
  if (buf) cur.push(buf)

  // binaries w/precedence
  // FIXME: create tree instead of groups, convert ops in-place
  const oper = (s, l) => Array.isArray(s) ? [s.shift(), ...s.map(oper)] : s.includes(op) ? [op, ...s.split(op)] : s.trim()
  for (op of opl) cur = cur.map(oper)

  // unwrap
//FIXME: rebuild tree here
  const deref = (s,c,e,r,i,m,n,un,a) => Array.isArray(s) ? [s.shift(), ...s.map(deref)]
    : ~(c = s.indexOf('#')) ? (
      e=s.indexOf('#',c+2), e = ~e?e:s.length,
      i = s.slice(c+2,e), m=s[c+1],
      n=s.slice(un=s.indexOf('@')+1, c),
      // k=s.substr(0,  s.indexOf(':')),
      r = m=='v' ? console.log(s,c)||v[i]
        : m == 'g' ? (a=deref(g[i]), c ? [n,a] : a) // fn call or group
        : m == 'p' ? (a=deref(g[i]), c ? ['[',n,a] : a) // property or array
        : m == 'o' ? !g[i]?{}:(a=g[i][0]==':'?[g[i]]:g[i].slice(1), Object.fromEntries(a.map(x=>[unq(deref(x[1])),deref(x[2])])))
        : r, // id
      r = un ? u[s.slice(0,un-1)].reduce((r,op)=>[op, r],r) : r // unary op
    )
    : s

  return deref(cur)
}
const unq = s => s[0]=='"'?s.slice(1,-1):s

// tree → result
export const evaluate = (seq, ctx={}, ops=operators, f,k) => Array.isArray(seq)
// FIXME: possibly we have to reduce non-pairs but full ops
  ? (f=ops[seq[0]]||ctx[seq[0]],seq=seq.slice(1).map(x=>console.log(x,evaluate(x,ctx,ops))||evaluate(x,ctx,ops)), seq.length<2 ? f(void 0,seq[0]) : seq.reduce(f))
  : typeof seq === 'string' ? (seq[0] === '"' ? seq.slice(1,-1) : ctx[seq])
  : seq

// code → evaluator
export default (seq, ops=operators) => (
  seq = typeof seq === 'string' ? parse(seq, ops) : seq,
  ctx => evaluate(seq, ctx, ops)
)

const dprop = (obj, key)=> key.split('.').reduce((a,b)=>b?a?.[b]:a, obj)
