import test, {is} from 'tst'

const src = c => `1 + (a * b / c % d) - 2.0 + -3e-3 * +4.4e4 / f.g[0] - i.j(+k == 1)(${c})`
const args={a:123, b:234, c:345, d:456, f:{g:[567]}, i:{j: yes => yes && (x => +x ? 0 : 1) }, k:1}
const result = 81.19328272371752
const RUNS = 3e4

test.skip('expr-eval', async t => {
  const {Parser} = await import('../lib/parser/expr-eval.min.js');

  let eeparser = new Parser({logical: true}), expr = eeparser.parse(src(0))
  // console.log(expr);
  is(expr.evaluate(args), result)

  console.time('expr-eval')
  eeparser = new Parser();
  for (let i = 0; i < RUNS; i++){
    let expr = eeparser.parse(src(i));
    // expr.evaluate(args);
  }
  console.timeEnd('expr-eval')

  console.time('expr-eval2')
  for (let i = 0; i < RUNS; i++) {
    expr.evaluate(args);
  }
  console.timeEnd('expr-eval2')
})

test('subscript', async t => {
  const {default:parse} = await import('../subscript.js');

  let ast = parse(src(0))
  // console.log(ast);
  is(ast(args), result);

  console.time('subscript')
  for (let i = 0; i < RUNS; i++){
    let ast = parse(src(i));
    // evaluate(ast, args)
  }
  console.timeEnd('subscript')

  console.time('subscript eval')
  for (let i = 0; i < RUNS; i++){
    ast(args)
  }
  console.timeEnd('subscript eval')
})

test('jsep', async t => {
  const jsep = await import('../lib/parser/expression-eval.module.js');

  let ast = jsep.parse(src(0))
  // console.log(ast);
  is(jsep.eval(ast, args), result)
  // is(jsep.eval(jsep.parse('"abc".toString()')), 'abc');

  console.time('jsep')
  for (let i = 0; i < RUNS; i++){
    let ast = jsep.parse(src(i));
    // jsep.eval(ast, args)
  }
  console.timeEnd('jsep')


  console.time('jsep eval')
  for (let i = 0; i < RUNS; i++) {
    jsep.eval(ast, args)
  }
  console.timeEnd('jsep eval')
})

test('subscript x2', async t => {
  const {default:parse} = await import('../subscript.js');

  let ast = parse(src(0))
  // console.log(ast);
  is(ast(args), result);

  console.time('subscript')
  for (let i = 0; i < RUNS; i++){
    let ast = parse(src(i));
    // evaluate(ast, args)
  }
  console.timeEnd('subscript')

  console.time('subscript eval')
  for (let i = 0; i < RUNS; i++){
    ast(args)
  }
  console.timeEnd('subscript eval')
})

test('jsep x2', async t => {
  const jsep = await import('../lib/parser/expression-eval.module.js');

  let ast = jsep.parse(src(0))
  // console.log(ast);
  is(jsep.eval(ast, args), result);

  console.time('jsep')
  for (let i = 0; i < RUNS; i++){
    let ast = jsep.parse(src(i));
    // jsep.eval(ast, args)
  }
  console.timeEnd('jsep')

  console.time('jsep eval')
  for (let i = 0; i < RUNS; i++){
    jsep.eval(ast, args)
  }
  console.timeEnd('jsep eval')
})

test.skip('jsep-strip', async t => {
  const {parse} = await import('../lib/parser/jsep-strip.js');

  let ast= parse(src(0))
  // console.log(ast );
  // is(evaluate(ast, args), result);

  console.time('jsep-strip')
  for (let i = 0; i < RUNS; i++){
    let ast = parse(src(i));
  }
  console.timeEnd('jsep-strip')
  // console.time('jsep-strip eval')
  // for (let i = 0; i < RUNS; i++){
  //   let ast = parse(src(i));
  // }
  // console.timeEnd('jsep-strip eval')
})

test.skip('jsep x3', async t => {
  const jsep = await import('../lib/parser/expression-eval.module.js');

  let ast = jsep.parse(src(0))
  // console.log(ast);
  is(jsep.eval(ast, args), result);

  console.time('jsep')
  for (let i = 0; i < RUNS; i++){
    let ast = jsep.parse(src(i));
    // jsep.eval(ast, args)
  }
  console.timeEnd('jsep')
  console.time('jsep eval')
  for (let i = 0; i < RUNS; i++){
    let ast = jsep.parse(src(i));
    jsep.eval(ast, args)
  }
  console.timeEnd('jsep eval')
})

test.skip('subscript x3', async t => {
  const {default:parse} = await import('../subscript.js');

  let ast = parse(src(0))
  // console.log(ast);
  is(ast(args), result);

  console.time('subscript')
  for (let i = 0; i < RUNS; i++){
    let ast = parse(src(i));
    // evaluate(ast, args)
  }
  console.timeEnd('subscript')

  console.time('subscript eval')
  for (let i = 0; i < RUNS; i++){
    ast(args)
  }
  console.timeEnd('subscript eval')
})

test('justin', async t => {
  const {default:parse} = await import('../justin.js');

  let evaluate = parse(src(0))
  is(evaluate(args), result);

  console.time('justin')
  for (let i = 0; i < RUNS; i++){
    let ast = parse(src(i));
    // evaluate(ast, args)
  }
  console.timeEnd('justin')
  console.time('justin eval')
  for (let i = 0; i < RUNS; i++){
    evaluate(args)
  }
  console.timeEnd('justin eval')
})

test.skip('jexpr', async t => {
  const {default:parseSS} = await import('../subscript.js')

  const src = `1 + (a * b / c % d) - 2.0 + -0.003 * +44000  / f.g[0] - i.j(+k == 1)(0)`
  let sseval = parseSS(src)
  // console.log(ast);
  // is(sseval(args), result);

  const {parse, EvalAstFactory} = await import('https://cdn.skypack.dev/jexpr');

  const astFactory = new EvalAstFactory()
  let expr = parse(src, astFactory)
  // console.log(ast);
  is(expr.evaluate(args), sseval(args))

  // let exp1e2 = parse('1e2', astFactory)
  // is(exp1e2.evaluate(), 1e2)
  // let exp1e2 = parse('1e-2', astFactory)
  // is(exp1e2.evaluate(), 1e-2)

  console.time('jexpr')
  for (let i = 0; i < RUNS; i++) {
    let ast = parse(src, astFactory);
  }
  console.timeEnd('jexpr')

  console.time('jexpr eval')
  for (let i = 0; i < RUNS; i++) {
    expr.evaluate(args)
  }
  console.timeEnd('jexpr eval')
})

test.skip('jexl', async t => {
  const {Jexl} = await import('../lib/parser/jexl.min.js');

  let jexl = new Jexl, expr, jexlArgs = Object.assign({}, args, {i:[1]}),
    src = x => `1 + (a * b / c % d) - 2.0 + -0.003 * 44000 / f.g[0] - i[0]`

  is(jexl.evalSync(src(0),jexlArgs), result);

  console.time('jexl')
  for (let i = 0; i < RUNS; i++){
    jexl.compile(src(i))
  }
  console.timeEnd('jexl')

  console.time('jexl eval')
  let src0 = src(0)
  for (let i = 0; i < RUNS; i++){
    jexl.evalSync(src0, args)
  }
  console.timeEnd('jexl eval')
})

test.skip('mozjexl', async t => {
  const mozjexl = await import('https://cdn.skypack.dev/mozjexl');
  console.log(mozjexl)

  let jexl = new Jexl, expr, jexlArgs = Object.assign({}, args, {i:[1]}),
    src = x => `1 + (a * b / c % d) - 2.0 + -0.003 * 44000 / f.g[0] - i[0]`

  is(jexl.evalSync(src(0),jexlArgs), result);

  console.time('jexl')
  for (let i = 0; i < RUNS; i++){
    jexl.compile(src(i))
  }
  console.timeEnd('jexl')

  console.time('jexl eval')
  let src0 = src(0)
  for (let i = 0; i < RUNS; i++){
    jexl.evalSync(src0, args)
  }
  console.timeEnd('jexl eval')
})

test.skip('string-math', async t => {
  const {default:sm} = await import('../lib/parser/string-math.js');
  console.time('string-math')
  for (let i = 0; i < RUNS; i++){
    sm(`(3 + 2) * 3 / 2 + 4 * 2 - ${i}`)
  }
  console.timeEnd('string-math')
  console.time('string-math eval')
  for (let i = 0; i < RUNS; i++){
    sm(`(3 + 2) * 3 / 2 + 4 * 2 - ${i}`)
  }
  console.timeEnd('string-math eval')
})

test.skip('mathjs', async t => {
  const {compile} = await import('https://cdn.skypack.dev/mathjs');

  let src = `1 + (a * b / c % d) - 2.0 + -3e-3 * +4.4e4 / f.g[1] - i.j(+k == 1)`,
      args = {a:123, b:234, c:345, d:456, f:{g:[567,567]}, i:{j: yes => yes && (+0 ? 0 : 1) }, k:1}

  let {evaluate} = compile(src)
  is(evaluate(args), result);

  console.time('mathjs')
  for (let i = 0; i < RUNS; i++){
    compile(src)
  }
  console.timeEnd('mathjs')
  console.time('mathjs eval')
  for (let i = 0; i < RUNS; i++){
    evaluate(args)
  }
  console.timeEnd('mathjs eval')
})


test.skip('math-parser', async t => {
  const {parse} = await import('https://cdn.skypack.dev/math-parser');

  let src = `1 + (a * b / c / d) - 2.0 + -3e-3 * +4.4e4 / f - i(+k+1)`,
      args = {a:123, b:234, c:345, d:456, f:{g:[567,567]}, i:{j: yes => yes && (+0 ? 0 : 1) }, k:1}

  // console.log(parse(src))
  // let {evaluate} = parse(src)
  // is(evaluate(args), result);

  console.time('math-parser')
  for (let i = 0; i < RUNS; i++){
    parse(src)
  }
  console.timeEnd('math-parser')
  // console.time('math-parser eval')
  // for (let i = 0; i < RUNS; i++){
  //   evaluate(args)
  // }
  // console.timeEnd('math-parser eval')
})


test.skip('mr-parser', async t => {
  const {Parser} = await import('https://cdn.skypack.dev/mr-parser');

  let src = `1 + (a * b / c % d) - 2.0 + -3e-3 * +4.4e4 / f - i(+k == 1)`,
      args = {a:123, b:234, c:345, d:456, f:{g:[567,567]}, i:{j: yes => yes && (+0 ? 0 : 1) }, k:1}

  let parser = new Parser
  // console.log(parser.parse(src))

  console.time('mr-parser')
  for (let i = 0; i < RUNS; i++){
    parser.parse(src)
  }
  console.timeEnd('mr-parser')
  // console.time('math-parser eval')
  // for (let i = 0; i < RUNS; i++){
  //   evaluate(args)
  // }
  // console.timeEnd('math-parser eval')
})


test.skip('math-expression-evaluator', async t => {
  const {default:mexp} = await import('https://cdn.skypack.dev/math-expression-evaluator');

  let src = `1 + (pi * e / pi ^ e) - 2.0 + -3e-3 * +4.4e4 / e - sin(-e + 1)`
  let lexed = mexp.lex(src)
  let postfix = lexed.toPostfix()
  // console.log(ast);
  // is(postfix.postfixEval(), result);

  console.time('math-expression-evaluator')
  for (let i = 0; i < RUNS; i++){
    let l = mexp.lex(src);
    l.toPostfix()
    // evaluate(ast, args)
  }
  console.timeEnd('math-expression-evaluator')

  console.time('math-expression-evaluator eval')
  for (let i = 0; i < RUNS; i++){
    postfix.postfixEval()
  }
  console.timeEnd('math-expression-evaluator eval')
})


test.skip('subscript-refs', async t => {
  const {default:dislex,parse:dparse,evaluate} = await import('../lib/parser/subscript-refs.js');
  console.time('dislex')
  for (let i = 0; i < RUNS; i++){
    let tree = dparse(src(i))
    // evaluate(tree,args)
  }
  console.timeEnd('dislex')
  console.time('dislex eval')
  for (let i = 0; i < RUNS; i++){
    let tree = dparse(src(i))
    evaluate(tree,args)
  }
  console.timeEnd('dislex eval')
})

test.skip('subscript-v1', async t => {
  const {default:v1,parse:v1parse,evaluate} = await import('../lib/parser/subscript-lex.js');
  console.time('subscript1')
  for (let i = 0; i < RUNS; i++){
    let tree = v1parse(src(i))
    // evaluate(tree,args)
  }
  console.timeEnd('subscript1')
  // console.time('subscript1 eval')
  // for (let i = 0; i < RUNS; i++){
  //   let tree = v1parse(src(i))
  //   evaluate(tree,args)
  // }
  // console.timeEnd('subscript1 eval')
})


test.skip('subscript v5', async t => {
  const {parse, evaluate} = await import('../lib/parser/subscript-v5.js');

  let ast = parse(src(0))
  // console.log(ast);
  is(evaluate(ast, args), result);

  console.time('subscript')
  for (let i = 0; i < RUNS; i++){
    let ast = parse(src(i));
    // evaluate(ast, args)
  }
  console.timeEnd('subscript')
  console.time('subscript eval')
  for (let i = 0; i < RUNS; i++) {
    evaluate(ast, args)
  }
  console.timeEnd('subscript eval')
})


test.skip('new Function', async t => {
  console.time('new Function')
  for (let n = 0; n < RUNS; n++){
    let fn = new Function('a','b', 'c', 'd', 'f', 'i', 'k', 'return '+src(n))
    // f(3, 4)
  }
  console.timeEnd('new Function')

  let {a,b,c,d,f,i,k} = args
  let fn = new Function('a','b', 'c', 'd', 'f', 'i', 'k', 'return '+src(0))
  console.time('new Function eval')
  for (let n = 0; n < RUNS; n++){
    fn(a,b,c,d,f,i,k)
  }
  console.timeEnd('new Function eval')
})

test.skip('direct fn', async t => {
  const createFn = (n) => (a,b, c, d, f, i, k) => 1 + (a * b / c % d) - 2.0 + -3e-3 * +4.4e4 / f.g[0] - i.j(+k == 1)(n)

  console.time('direct fn')
  for (let n = 0; n < RUNS; n++){
    let fn = createFn(n)
    // fn(3, 4)
  }
  console.timeEnd('direct fn')

  let fn = createFn(0)
  let {a,b,c,d,f,i,k} = args
  console.time('direct fn eval')
  for (let n = 0; n < RUNS; n++){
    fn(a,b,c,d,f,i,k)
  }
  console.timeEnd('direct fn eval')
})

test('es-module-lexer', async t => {
  const {init, parse} = await import('es-module-lexer')
  await init;

  // console.log(parse(src(1)))

  console.time('es-module-lexer')
  for (let i = 0; i < RUNS; i++){
    parse(src(i))
  }
  console.timeEnd('es-module-lexer')
})

test('object key', async t => {
  const obj = {}
  console.time('object key')
  for (let i = 0; i < RUNS; i++){
    obj[src(i)] = true
  }
  console.timeEnd('object key')
})

test('Map', async t => {
  const map = new Map
  console.time('Map.set')
  for (let i = 0; i < RUNS; i++){
    map.set(src(i), true)
  }
  console.timeEnd('Map.set')
})

test('TextEncoder/Decoder', async t => {
  const binary = btoa(src(0))

  console.time('u8array.from')
  for (let i = 0; i < RUNS; i++){
    Uint8Array.from(atob(binary), x => x.charCodeAt(0))
  }
  console.timeEnd('u8array.from')

  const encoder = new TextEncoder()
  console.time('TextEncoder')
  for (let i = 0; i < RUNS; i++){
    encoder.encode(src(i))
  }
  console.timeEnd('TextEncoder')


  function copyBE (src, outBuf16 = new Uint16Array(src.length)) {
    const len = src.length;
    let i = 0;
    while (i < len) {
      const ch = src.charCodeAt(i);
      outBuf16[i++] = (ch & 0xff) << 8 | ch >>> 8;
    }
  }
  console.time('copyBE')
  for (let i = 0; i < RUNS; i++){
    copyBE(src(i))
  }
  console.timeEnd('copyBE')
})
