export type OperatorFunction = (...args: any[]) => any;

export type OperatorMap = {
  [key: string]: OperatorFunction;
};

export type Node = string | [string, ...Node[]];

export function compile(node: Node): ((ctx?: any) => any) | OperatorFunction;
export const operators: OperatorMap;
export function operator(op: string, fn: OperatorFunction): void;

export default compile;
