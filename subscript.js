export const operators = [
  {
    '(':(...a)=>a(...args),
    '[':(...a)=>a.reduce((a,b)=>a?a[b]:a),
    '.':(...a)=>a.reduce((a,b)=>a?a[b]:a)
  },
  {
    '!':a=>!a,
    '+':a=>+a,
    '-':a=>-a,
    '++':a=>++a,
    '--':a=>--a
  },
  {
    '%':(...a)=>a.reduce((a,b)=>a%b),
    '/':(...a)=>a.reduce((a,b)=>a/b),
    '*':(...a)=>a.reduce((a,b)=>a*b),
  },
  {
    '+':(...a)=>a.reduce((a,b)=>a+b),
    '-':(...a)=>a.reduce((a,b)=>a-b),
  },
  {
    '>>>':(a,b)=>a>>>b,
    '>>':(a,b)=>a>>b,
    '<<':(a,b)=>a<<b,
  },
  {
    '>=':(a,b)=>a>=b,
    '>':(a,b)=>a>b,
    '<=':(a,b)=>a<=b,
    '<':(a,b)=>a<b,
  },
  {
    '!=':(a,b)=>a!=b,
    '==':(a,b)=>a==b,
  },
  {'&':(a,b)=>a&b},
  {'^':(a,b)=>a^b},
  {'|':(a,b)=>a|b},
  {'&&':(...a)=>a.every(Boolean)},
  {'||':(...a)=>a.some(Boolean)},
  {',':(...a)=>a[a.length-1]},
],
operator = (s,l,o,i) => {
  if (!s || typeof s != 'string' || quotes[s[0]]) return
  for (i=operators.length;i--;) if (o=operators[i][s], o&&l==1?o.length==l:o) return o
},
literals = {true:true, false:false, null:null, undefined:undefined},
blocks = {'(':')','[':']'},
quotes = {'"':'"'},
transforms = {
  // [(, a] → a, [(,a,''] → [a], [(,a,[',',b,c],d] → [[a,b,c],d]
  '(': s => s.length < 2 ? s[1] : s.slice(1).reduce((a,b)=>[a].concat(!b?[]:b[0]==','?b.slice(1):[b])),
  '.': s => [s[0],s[1], ...s.slice(2).map(a=>`"${a}"`)] // [.,a,b → [.,a,'"b"'
},
transform = (n, t) => (t = isnode(n)&&transforms[n[0]], t?t(n):n),

isnode = a=>Array.isArray(a)&&a.length&&a[0],
space = ' \r\n\t',

// code → calltree
parse = (s, i=0) => {
  const tokenize = (end, buf='', n, q, c, br, cur=[]) => {
    const commit = op => {
      if (buf!=='') cur.push(n ? parseFloat(buf) : buf in literals ? literals[buf] : buf)
      if (op) cur.push(op)
      n=buf=c=''
    }

    for (; i<=s.length; buf+=c) {
      c = s[i++]
      if (q && c==q) q=''
      else if (n && (c=='e'||c=='E')) c+=s[i++]
      else if (space.includes(c)) commit()
      else if (quotes[c]) q=c
      else if (!buf && c>='0' && c<='9' || c=='.' && s[i]>='0' && s[i]<='9') n=1
      else if (br=blocks[c]) commit(c), cur.push(tokenize(br))
      else if (c==end) return commit(), group(cur)
      else if (operator(c+=s[i++])||operator(c=(i--,c[0])))
        if (c.toLowerCase()==c.toUpperCase() || !buf&&space.includes(s[i])) // word operators
        commit(c)
    }
  },

  // group into calltree nodes by precedence
  group = (s) => {
    if (!s.length) return undefined

    let prec, i, gi, a,b,x, f

    const commit=() => ~gi && (s[gi]=transform(s[gi]), gi=-1)

    for (prec of operators) {
      for (gi=-1,i=1;i<s.length;) {
        a=s[i-2],x=s[i-1],b=s[i], f = typeof x === 'string' && prec[x]
        if (f && !operator(b) && i>1&&!operator(a)) { // binary: a+b
          if (prec[x].length==1) commit(), i++ // skip non-binary op
          else if (gi==i-2 && a[0]==x) a.push(b), s.splice(i-1,2) // ,[+,a,b],+,c → ,[+,a,b]
          else commit(), s.splice(gi=i-2,3,[x,s[gi],b]) // ,a,+,b, → ,[+,a,b],
        }
        else if (f && !operator(b)) { // unary prefix: +b, -+b
          s.splice(gi=i-1,2,[x,b]) // _,-,b → _,[-,b]
          i-- // (shift left to consume prefix unary or binary)
        }
        // TODO: detect postfix unary
        else commit(),i++
      }
      commit() // last binary can be hanging
    }

    return s.length>1?s:s[0]
  }

  s=tokenize()
  return s
},

// calltree → result
evaluate = (s, ctx={},x) => isnode(s)
  ? (isnode(s[0]) ? evaluate(s[0]) : ctx[s[0]]||operator(s[0],s.length-1))(...s.slice(1).map(a=>evaluate(a,ctx)))
  : typeof s == 'string'
  ? quotes[s[0]] ? s.slice(1,-1) : ctx[s]
  : s

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s, ctx => evaluate(s, ctx))

