export let idx: any;
export let cur: any;
export function parse(s: string): any;
export namespace parse {
  function space(cc: any): any;
  function id(n: any): any;
}
export function err(msg?: string, frag?: string): never;
export namespace err {
  /** Error pointer: string suffix (diacritics) or [before, after] wrapper */
  let ptr: string | [string, string];
}
export function skip(): string;
export function next(is: ((c: number) => number)): string;
export const lookup: ((a: any, b: any) => any)[];
export function token(op: string, prec: number, map: (a: any, curPrec: number, from: number) => any): (a: any, curPrec: number, from?: any) => any;
export function binary(op: string, prec: number, right?: boolean | undefined): (a: any, curPrec: number, from?: any) => any;
export function access(op: string, prec: number): (a: any, curPrec: number, from?: any) => any;
export function group(op: string, prec: number): (a: any, curPrec: number, from?: any) => any;
export function unary(op: string, prec: number, post?: boolean | undefined): (a: any, curPrec: number, from?: any) => any;
export function literal(op: string, val: any): (a: any, curPrec: number, from?: any) => any;
export function nary(op: string, prec: number, skips?: boolean | undefined): (a: any, curPrec: number, from?: any) => any;
export function expr(prec: number, end?: string | undefined): any;
export function isId(c: number): boolean;
export function space(): number;
export function id(): string;

/** Validator registry - keyed by operator */
export const validators: Record<string, (node: any[], ctx?: any) => void>;

/** Register a validator (chains with previous). Pass null to remove. */
export function validator(op: string, fn: ((node: any[], ctx?: any) => void) | null): void;

/** Validate AST recursively (bottom-up). Returns node for chaining. */
export function validate(node: any, ctx?: any): any;

export default parse;
