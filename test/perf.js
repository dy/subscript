import test, {is} from '../lib/test.js'

const src = c => `1 + (a * b / c % d) - 2.0 + -3e-3 * +4.4e4 / f.g[0] - i.j(+k == 1)(${c})`
const args={a:123, b:234, c:345, d:456, f:{g:[567]}, i:{j: yes => yes && (x => +x ? 0 : 1) }, k:1}
const result = 81.19328272371752
const RUNS = 3e4

test('expr-eval', async t => {
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
  const {parse, evaluate} = await import('../subscript.min.js');

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
  for (let i = 0; i < RUNS; i++){
    evaluate(ast, args)
  }
  console.timeEnd('subscript eval')
})


test('jsep', async t => {
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
  for (let i = 0; i < RUNS; i++) {
    jsep.eval(ast, args)
  }
  console.timeEnd('jsep eval')
})


test('subscript x2', async t => {
  const {parse, evaluate} = await import('../subscript.min.js');

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
  const {parse, evaluate} = await import('../subscript.min.js');

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
  for (let i = 0; i < RUNS; i++){
    let ast = parse(src(i));
    evaluate(ast, args)
  }
  console.timeEnd('subscript eval')
})

test('justin', async t => {
  const {parse, evaluate} = await import('../justin.js');

  let ast = parse(src(0))
  console.log(ast);
  is(evaluate(ast, args), result);

  console.time('justin')
  for (let i = 0; i < RUNS; i++){
    let ast = parse(src(i));
    // evaluate(ast, args)
  }
  console.timeEnd('justin')
  console.time('justin eval')
  for (let i = 0; i < RUNS; i++){
    evaluate(ast, args)
  }
  console.timeEnd('justin eval')
})


test('jexl', async t => {
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


test('new Function', async t => {
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

test('direct fn', async t => {
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
