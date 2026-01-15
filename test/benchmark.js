/**
 * Comprehensive parser/evaluator benchmark
 * Run: node test/benchmark.js
 * Uses CDN imports - no dev dependencies needed
 */

const RUNS = 30000;

// Expression covering: arithmetic, member access, calls
const expr = `a + b * c - d / e + f.g[0](h) + i.j`;
const ctx = {
  a: 1, b: 2, c: 3, d: 4, e: 5,
  f: { g: [x => x + 1] }, h: 10, i: { j: 20 }
};

const bench = (name, fn) => {
  // Warmup
  for (let i = 0; i < 1000; i++) fn();
  
  const t = performance.now();
  for (let i = 0; i < RUNS; i++) fn();
  const ms = performance.now() - t;
  console.log(`${name}: ${ms.toFixed(1)}ms`);
  return ms;
};

const results = { parse: {}, eval: {} };

// CDN helper
const cdn = pkg => import(`https://esm.sh/${pkg}`);

async function run() {
  console.log(`\nBenchmark: ${RUNS} iterations\n`);
  console.log(`Expression: ${expr}\n`);
  console.log('=== PARSE ===\n');

  // expr (subscript core)
  try {
    const { parse } = await import('../parse/expr.js');
    parse(expr);
    results.parse['expr'] = bench('expr', () => parse(expr));
  } catch (e) { console.log('expr: SKIP -', e.message); }

  // justin
  try {
    const { parse } = await import('../parse/justin.js');
    parse(expr);
    results.parse['justin'] = bench('justin', () => parse(expr));
  } catch (e) { console.log('justin: SKIP -', e.message); }

  // jessie
  try {
    const { parse } = await import('../parse/jessie.js');
    parse(expr);
    results.parse['jessie'] = bench('jessie', () => parse(expr));
  } catch (e) { console.log('jessie: SKIP -', e.message); }

  // jsep
  try {
    const { default: jsep } = await cdn('jsep');
    jsep(expr);
    results.parse['jsep'] = bench('jsep', () => jsep(expr));
  } catch (e) { console.log('jsep: SKIP -', e.message); }

  // expr-eval
  try {
    const { Parser } = await cdn('expr-eval');
    const p = new Parser();
    const eeExpr = 'a + b * c - d / e + h + 20';
    p.parse(eeExpr);
    results.parse['expr-eval'] = bench('expr-eval', () => p.parse(eeExpr));
  } catch (e) { console.log('expr-eval: SKIP -', e.message); }

  // jexl
  try {
    const jexl = (await cdn('jexl')).default;
    jexl.compile(expr);
    results.parse['jexl'] = bench('jexl', () => jexl.compile(expr));
  } catch (e) { console.log('jexl: SKIP -', e.message); }

  // mathjs
  try {
    const { compile } = await cdn('mathjs');
    const mathExpr = 'a + b * c - d / e + h + 20';
    compile(mathExpr);
    results.parse['mathjs'] = bench('mathjs', () => compile(mathExpr));
  } catch (e) { console.log('mathjs: SKIP -', e.message); }

  // new Function
  try {
    const vars = Object.keys(ctx).join(',');
    new Function(vars, `return ${expr}`);
    results.parse['new Function'] = bench('new Function', () => new Function(vars, `return ${expr}`));
  } catch (e) { console.log('new Function: SKIP -', e.message); }

  // scopex - parse+eval combined
  try {
    const scopex = (await cdn('scopex')).default;
    scopex(ctx, expr);
    results.parse['scopex'] = bench('scopex (parse+eval)', () => scopex(ctx, expr));
  } catch (e) { console.log('scopex: SKIP -', e.message); }

  // define-function
  try {
    const { default: defineFunction } = await cdn('define-function');
    defineFunction(Object.keys(ctx), expr);
    results.parse['define-function'] = bench('define-function', () => defineFunction(Object.keys(ctx), expr));
  } catch (e) { console.log('define-function: SKIP -', e.message); }

  // vastly/mavo
  try {
    const { default: Vastly } = await cdn('vastly');
    Vastly.parse(expr);
    results.parse['vastly'] = bench('vastly', () => Vastly.parse(expr));
  } catch (e) { console.log('vastly: SKIP -', e.message); }

  // angular-expressions
  try {
    const ae = await cdn('angular-expressions');
    ae.compile(expr);
    results.parse['angular-expr'] = bench('angular-expr', () => ae.compile(expr));
  } catch (e) { console.log('angular-expr: SKIP -', e.message); }

  console.log('\n=== EVAL ===\n');

  // subscript compile (js)
  try {
    const { parse, compile } = await import('../subscript.js');
    const fn = compile(parse(expr));
    fn(ctx);
    results.eval['compile (js)'] = bench('compile (js)', () => fn(ctx));
  } catch (e) { console.log('compile (js): SKIP -', e.message); }

  // new Function
  try {
    const vars = Object.keys(ctx);
    const fn = new Function(...vars, `return ${expr}`);
    fn(...vars.map(v => ctx[v]));
    results.eval['new Function'] = bench('new Function', () => fn(...vars.map(v => ctx[v])));
  } catch (e) { console.log('new Function: SKIP -', e.message); }

  // expression-eval (jsep + eval)
  try {
    const { default: jsep } = await cdn('jsep');
    const { eval: jsepEval } = await cdn('expression-eval');
    const ast = jsep(expr);
    jsepEval(ast, ctx);
    results.eval['expression-eval'] = bench('expression-eval', () => jsepEval(ast, ctx));
  } catch (e) { console.log('expression-eval: SKIP -', e.message); }

  // jexl
  try {
    const jexl = (await cdn('jexl')).default;
    const compiled = jexl.compile(expr);
    compiled.evalSync(ctx);
    results.eval['jexl'] = bench('jexl', () => compiled.evalSync(ctx));
  } catch (e) { console.log('jexl: SKIP -', e.message); }

  // mathjs
  try {
    const { compile } = await cdn('mathjs');
    const mathExpr = 'a + b * c - d / e + h + 20';
    const compiled = compile(mathExpr);
    compiled.evaluate(ctx);
    results.eval['mathjs'] = bench('mathjs', () => compiled.evaluate(ctx));
  } catch (e) { console.log('mathjs: SKIP -', e.message); }

  // scopex
  try {
    const scopex = (await cdn('scopex')).default;
    scopex(ctx, expr);
    results.eval['scopex'] = bench('scopex', () => scopex(ctx, expr));
  } catch (e) { console.log('scopex: SKIP -', e.message); }

  // vastly
  try {
    const { default: Vastly } = await cdn('vastly');
    const ast = Vastly.parse(expr);
    Vastly.evaluate(ast, ctx);
    results.eval['vastly'] = bench('vastly', () => Vastly.evaluate(ast, ctx));
  } catch (e) { console.log('vastly: SKIP -', e.message); }

  // angular-expressions
  try {
    const ae = await cdn('angular-expressions');
    const fn = ae.compile(expr);
    fn(ctx);
    results.eval['angular-expr'] = bench('angular-expr', () => fn(ctx));
  } catch (e) { console.log('angular-expr: SKIP -', e.message); }

  // Summary
  console.log('\n=== SUMMARY ===\n');
  
  console.log('Parse (sorted):');
  const parseSorted = Object.entries(results.parse).sort((a, b) => a[1] - b[1]);
  for (const [name, ms] of parseSorted) {
    console.log(`  ${name}: ${ms.toFixed(0)}ms`);
  }
  
  console.log('\nEval (sorted):');
  const evalSorted = Object.entries(results.eval).sort((a, b) => a[1] - b[1]);
  for (const [name, ms] of evalSorted) {
    console.log(`  ${name}: ${ms.toFixed(0)}ms`);
  }
}

run().catch(console.error);
