// justin lang https://github.com/endojs/Jessie/issues/66
import {parse, set, lookup, skip, cur, idx, err, code, expr, isId, space} from './index.js'
import './subscript.js'

const PERIOD=46, OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, DQUOTE=34, QUOTE=39, _0=48, _9=57, BSLASH=92,
PREC_SEQ=1, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_EXP=14, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_GROUP=19


let u, list, op, prec, fn,
    escape = {n:'\n', r:'\r', t:'\t', b:'\b', f:'\f', v:'\v'},
    string = q => (qc, c, str='') => {
      while (c=code(), c-q) {
        if (c === BSLASH) skip(), c=skip(), str += escape[c] || c
        else str += skip()
      }
      return skip()||err('Bad string'), () => str
    }

// operators
for (list=[
  // "' with /
  '"',, string(DQUOTE),
  "'",, string(QUOTE),

  // /**/, //
  '/*',, (a, prec) => (skip(c => c !== 42 && code(1) !== 47), skip(2), a||expr(prec)),
  '//',, (a, prec) => (skip(c => c >= 32), a||expr(prec)),

  // literals
  'null',, a => a ? a : ()=>null,
  'true',, a => a ? a : ()=>true,
  'false',, a => a ? a : ()=>false,
  'undefined',, a => a ? a : ()=>undefined,

  // operators
  ';', PREC_SEQ, (a,b) => b,
  '===', PREC_EQ, (a,b) => a===b,
  '!==', PREC_EQ, (a,b) => a!==b,
  '**', PREC_EXP, (a,b) => a**b,
  '~', PREC_UNARY, (a=0) => ~a,

  // ?:
  ':', 3.1, (a,b) => [a,b],
  '?', 3, (a,b) => a ? b[0] : b[1],

  'in', PREC_COMP, (a,b) => a in b,

  // [a,b,c]
  '[',, (a, args) => !a && (
    a=expr(), code()==93?skip():err(),
    !a ? ctx => [] : ctx => (args=a(ctx), args?._args?[...args]:[args])
  ),

  // {a, b, c}
  '{',, (a, args) => !a && (
    a=expr(), code()==125?skip():err(),
    !a ? ctx => ({}) : ctx => (args=a(ctx), Object.fromEntries(args?._args?[...args]:[args]))
  ),
  ':',, (a, prec, b) => (b=expr(3)||err(), ctx => [a(), b(ctx)])

]; [op,prec,fn,...list]=list, op;) set(op,prec,fn)

export default parse
