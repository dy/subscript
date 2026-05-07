/**
 * justin: JSON superset expression language
 *
 * Builds on subscript with JS-specific features:
 * optional chaining, arrow functions, spread, templates.
 *
 * For parse-only: import { parse } from 'subscript/feature/justin.js'
 */
import './feature/justin.js';
import './eval/justin.js';

export * from './parse.js';
export { default } from './subscript.js';
