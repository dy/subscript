export type OperatorFunction = (...args: any[]) => any;
export type OperatorMap = {
  [key: string]: OperatorFunction;
};
export type Node = string | [string | undefined, ...Node[]];
export function compile(node: Node): ((ctx?: any) => any) | OperatorFunction;
export const operators: OperatorMap;
export function operator(op: string, fn: OperatorFunction): void;

type AccessorFunction = (ctx: any) => any;
export function access(
  a: [string, ...any[]] | string,
  fn: Function,
  generic: boolean
): AccessorFunction;

export default compile;
