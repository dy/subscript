/**
 * Arithmetic operators - parse half
 *
 * + - * / %
 * Unary: + -
 */
import { binary, unary } from '../../parse.js';

const ADD = 110, MULT = 120, PREFIX = 140;

binary('+', ADD);
binary('-', ADD);
binary('*', MULT);
binary('/', MULT);
binary('%', MULT);

unary('+', PREFIX);
unary('-', PREFIX);
