// AST node types
export type Identifier = string;
export type Literal = [undefined, any];
export type Operation = [string, ...AST[]];
export type AST = Identifier | Literal | Operation;

// Evaluator function
export type Evaluator = (ctx?: any) => any;

// Operator compiler: receives args, returns evaluator
export type Operator = (...args: AST[]) => Evaluator | undefined;

// Parse exports
export let idx: number;
export let cur: string;
export function parse(s: string): AST;
export function err(msg?: string, at?: number): never;
export function loc<T>(node: T, at?: number): T;
export function next(is: (c: number) => number, from?: number): string;
export function skip(n?: number): string;
export function seek(n: number): number;
export function expr(prec?: number, end?: number): AST;
export const lookup: ((a: AST, prec: number, op?: string) => AST)[];
export function token(op: string, prec?: number, map?: (a: AST) => AST): void;
export function binary(op: string, prec: number, right?: boolean): void;
export function unary(op: string, prec: number, post?: boolean): void;
export function literal(op: string, val: any): void;
export function nary(op: string, prec: number, right?: boolean): void;
export function group(op: string, prec: number): void;
export function access(op: string, prec: number): void;

// Compile exports
export const operators: Record<string, Operator>;
export function operator(op: string, fn: Operator): void;
export function compile(node: AST): Evaluator;

// Default export
export default parse;

// subscript template tag
interface Subscript {
  (strings: TemplateStringsArray, ...values: any[]): Evaluator;
  (s: string): Evaluator;
}
declare const subscript: Subscript;
export { subscript };
