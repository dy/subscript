// Metacircularity test - jessie parses itself
import { parse } from '../parse/jessie.js';
import fs from 'fs';
import tst, { is } from 'tst';

function testFile(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    parse(content);
    return { file, ok: true };
  } catch (e) {
    return { file, ok: false, error: e.message };
  }
}

const files = [
  'subscript.js',
  'parse/pratt.js', 'parse/expr.js', 'parse/justin.js', 'parse/jessie.js',
  'compile/js.js', 'compile/js-emit.js',
  'util/bundle.js',
  ...fs.readdirSync('feature').filter(f => f.endsWith('.js')).map(f => 'feature/' + f),
  ...fs.readdirSync('feature/c').filter(f => f.endsWith('.js')).map(f => 'feature/c/' + f),
  ...fs.readdirSync('feature/js').filter(f => f.endsWith('.js')).map(f => 'feature/js/' + f),
];

// Test that all source files parse
tst('metacircular: parse all source files', () => {
  for (const f of files) {
    const r = testFile(f);
    is(r.ok, true, f + (r.error ? ': ' + r.error.split('\n')[0] : ''));
  }
});
