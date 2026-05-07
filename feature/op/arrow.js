/**
 * Arrow function operator - parse half
 *
 * (a, b) => expr → arrow function
 */
import { binary } from '../../parse.js';

const ASSIGN = 20;

binary('=>', ASSIGN, true);
