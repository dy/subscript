export let idx: any;
export let cur: any;

export function parse(s: string): any;
export namespace parse {
  function space(cc: any): any;
  function id(n: any): any;
}

export function err(msg?: string, frag?: string): never;

export function skip(is: number | ((c: number) => number)): string;

export const lookup: ((a: any, b: any) => any)[];

export function token(op: string, prec: number, map: (a: any, curPrec: number, from: number) => any): (a: any, curPrec: number, from?: any) => any;

export function binary(op: string, prec: number, right?: boolean|undefined): (a: any, curPrec: number, from?: any) => any;
export function unary(op: string, prec: number, post?: boolean|undefined): (a: any, curPrec: number, from?: any) => any;
export function nary(op: string, prec: number, skips?: boolean|undefined): (a: any, curPrec: number, from?: any) => any;

export function expr(prec: number, end?: string|undefined): any;

export function isId(c: number): boolean;
export function space(): number;
export function id(): string;

export default parse;


