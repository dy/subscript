export default subscript;
export * from "./parse.js";
export * from "./compile.js";
declare function subscript(s: string): ((ctx?: any) => any) | OperatorFunction;
export function set(op: string, prec: number, fn: OperatorFunction): void;
