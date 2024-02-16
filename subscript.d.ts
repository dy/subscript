import type { OperatorFunction } from './src/compile';

export default subscript;
export * from "./src/parse.js";
export * from "./src/compile.js";
declare function subscript(s: string): ((ctx?: any) => any) | OperatorFunction;
