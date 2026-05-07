// Unit suffixes - eval half
import { operator, compile } from '../parse.js';
import { unit as parseUnit } from '../feature/unit.js';

export const unit = (...names) => {
  parseUnit(...names);
  names.forEach(name =>
    operator(name, val => (val = compile(val), ctx => ({ value: val(ctx), unit: name })))
  );
};
