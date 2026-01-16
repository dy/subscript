import type { OperatorFunction } from './compile/js';

export default subscript;
export * from "./src/parse.js";
export * from "./compile/js.js";

type Evaluator = (ctx?: any) => any;

interface Subscript {
  // Template tag: subscript`a + b`
  (strings: TemplateStringsArray, ...values: any[]): Evaluator;
  // Direct call: subscript('a + b')
  (s: string): Evaluator;
  // Configurable parser
  parse: (s: string) => any;
  // Configurable compiler
  compile: (ast: any) => Evaluator;
}

declare const subscript: Subscript;
