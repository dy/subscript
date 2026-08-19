// BigInt literal feature (opt-in, not part of any dialect)
import test, { is, throws } from 'tst';
import { parse, compile } from '../../jessie.js';

test('bigint: not in default jessie', () => {
  throws(() => parse('123n'));
  throws(() => parse('0xFFn'));
});

test('bigint: literals (opt-in feature)', async () => {
  await import('../../feature/bigint.js');
  is(parse('123n'), ['n', '123']);
  is(parse('1_000n'), ['n', '1000']);
  is(parse('0n'), ['n', '0']);
  // prefixed bigint
  is(parse('0xFFn'), ['n', '0xFF']);
  is(parse('0o77n'), ['n', '0o77']);
  is(parse('0b101n'), ['n', '0b101']);
  is(parse('0x1_ABCn'), ['n', '0x1ABC']);
  // integer literals only
  throws(() => parse('1.5n'));
  throws(() => parse('1e3n'));
  throws(() => parse('.5n'));
  // hex digits may contain e/E — not an exponent
  is(parse('0xEn'), ['n', '0xE']);
  // plain numbers unaffected
  is(parse('123'), [, 123]);
  is(parse('0.95'), [, 0.95]);
});

test('bigint: eval (opt-in runtime)', async () => {
  await import('../../eval/bigint.js');
  is(compile(parse('123n'))(), 123n);
  is(compile(parse('0xFFn'))(), 255n);
  is(compile(parse('1n + 2n * 3n'))(), 7n);
  is(compile(parse('2n ** 70n'))(), 1180591620717411303424n);
});
