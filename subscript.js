export const operators = [
  {
    '(':(...a)=>a(...args),
    '[':(...a)=>a.reduce((a,b)=>a?a[b]:a),
    '.':(...a)=>a.reduce((a,b)=>a?a[b]:a)
  },
  {
    '!':a=>!a,
    '~':a=>~a,
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
operator = (s,o,i) => {
  if (!s || typeof s != 'string' || quotes[s[0]]) return
  for (i=operators.length;i--;) if (o=operators[i][s]) return o
},
literals = {true:true, false:false, null:null, undefined:undefined},
blocks = {'(':')','[':']'},
quotes = {'"':'"'},

transforms = {
  // [(, a] → a, [(,a,''] → [a], [(,a,[',',b,c],d] → [[a,b,c],d]
  '(': s => console.log(...s)||s.length < 2 ? s[1] : s.slice(1).reduce((a,b)=>[a].concat(!b?[]:b[0]==','?b.slice(1):[b])),//.map(transform),
  '.': s => [s[0],s[1], ...s.slice(2).map(a=>`"${a}"`)] // [.,a,b → [.,a,'"b"'
},
transform = (n, t) => (t = isnode(n)&&transforms[n[0]], t?t(n):n),

isnode = a=>Array.isArray(a)&&a.length&&a[0],

// code → calltree
parse = (s, i=0) => {
  const tokenize = (end, op, buf='', n, q, c, b, cur=[]) => {
    const commit = (v, op) => {
      if (v) cur.push(n ? parseFloat(v) : v in literals ? literals[v] : v)
      if (op) cur.push(op)
      n=buf=c=''
    }

    // FIXME: maybe commit operatorss as functions, not as string tokens?
    for (; i<=s.length; buf+=c) {
      c = s[i++]
      if (q && c==q) q=''
      else if (n && (c=='e'||c=='E')) c+=s[i++]
      else if (c==' '||c=='\r'||c=='\n'||c=='\t') c=''
      else if (quotes[c]) q=c
      else if (!buf && c>='0' && c<='9' || c=='.' && s[i]>='0' && s[i]<='9') n=1
      else if (b=blocks[c]) commit(buf, c), commit(tokenize(b))
      else if (c==end) return commit(buf), group(cur)
      else if (operator(op=c+s[i])||operator(op=c)) i+=op.length-1, commit(buf, op)
    }
  },

  // group into calltree nodes by precedence
  group = (s) => {
    if (!s.length) return ''

    let prec, i, gi, a,b,op, opf

    const commit=() => ~gi && (s[gi]=transform(s[gi]), gi=-1)

    for (prec of operators) {
      for (gi=i=-1;i<s.length;) {
        a=s[i],op=s[i+1],b=s[i+2], opf = typeof op === 'string' && prec[op]
        if (opf && !operator(b) && ~i&&!operator(a)) { // binary: a+b
          if (prec[op].length==1) commit(), i++ // skip non-binary op
          else if (gi===i&&a[0]==op) a.push(b), s.splice(i+1,2) // ,[+,a,b],+,c → ,[+,a,b]
          else commit(), s.splice(gi=i,3,[op,s[i],b]) // ,a,+,b, → ,[+,a,b],
        }
        else if (opf && !operator(b)) { // unary prefix: +b, -+b
          s.splice(gi=(~i?i:i--)+1,2,[op,b]) // _,-,b → _,[-,b] (shift left to consume prefix)
        }
        // TODO: detect postfix unary
        else commit(),i++
      }
    }

    return s.length>1?s:s[0]
  }

  s=tokenize()
  return s
},

// calltree → result
evaluate = (s, ctx={}) => isnode(s)
  ? (isnode(s[0]) ? evaluate(s[0]) : ctx[s[0]]||operator(s[0]))(...s.slice(1).map(a=>evaluate(a,ctx)))
  : typeof s == 'string'
  ? s[0] === '"' ? s.slice(1,-1) : ctx[s]
  : s

// code → evaluator
export default s => (s = typeof s == 'string' ? parse(s) : s, ctx => evaluate(s, ctx))

