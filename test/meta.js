// Metacircularity test - jessie parses itself
import { parse } from '../jessie.js';
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
  'parse.js', 'justin.js', 'jessie.js',
  'util/bundle.js', 'util/stringify.js',
  ...fs.readdirSync('feature').filter(f => f.endsWith('.js')).map(f => 'feature/' + f),
];

// Test that all source files parse
tst('metacircular: parse all source files', () => {
  for (const f of files) {
    const r = testFile(f);
    is(r.ok, true, f + (r.error ? ': ' + r.error.split('\n')[0] : ''));
  }
});
