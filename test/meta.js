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

// jz compiles this parser (its own compiler is built with it, and its jessie
// bench), and a jz closure takes at most 8 parameters (MAX_CLOSURE_ARITY there).
const params = p => p == null ? 0 : Array.isArray(p) && p[0] === ',' ? p.length - 1 : 1;
const functions = (n, out = []) => {
  if (!Array.isArray(n)) return out;
  if (n[0] === '=>') out.push([params(n[1]?.[0] === '()' ? n[1][1] : n[1]), n.loc]);
  if (n[0] === 'function' || n[0] === 'function*') out.push([params(n[2]), n.loc]);
  for (let i = 1; i < n.length; i++) functions(n[i], out);
  return out;
};
tst('metacircular: no function takes more than 8 parameters', () => {
  for (const f of files) for (const [n, at] of functions(parse(fs.readFileSync(f, 'utf8'))))
    is(n <= 8, true, `${f} at ${at}: ${n} parameters`);
});
