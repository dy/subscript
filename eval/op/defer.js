// Defer operator - eval half
import { operator, compile } from '../../parse.js';

operator('defer', a => (a = compile(a), ctx => { ctx.__deferred__ = ctx.__deferred__ || []; ctx.__deferred__.push(a); }));
