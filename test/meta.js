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

const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
  d.isDirectory() ? walk(dir + '/' + d.name) :
  d.name.endsWith('.js') ? [dir + '/' + d.name] : []
);

const files = [
  'subscript.js',
  'parse.js', 'justin.js', 'jessie.js',
  'util/bundle.js', 'util/stringify.js',
  ...walk('feature'),
  ...walk('eval'),
];

// Test that all source files parse
tst('metacircular: parse all source files', () => {
  for (const f of files) {
    const r = testFile(f);
    is(r.ok, true, f + (r.error ? ': ' + r.error.split('\n')[0] : ''));
  }
});
