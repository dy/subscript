import type { OperatorFunction } from './compile/js';

export default subscript;
export * from "./src/parse.js";
export * from "./compile/js.js";
declare function subscript(s: string): ((ctx?: any) => any) | OperatorFunction;
