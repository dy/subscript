/**
 * Arrow function operator
 *
 * (a, b) => expr → arrow function
 *
 * Common in: JS, TS, Java, C#, Kotlin, Scala
 */
import { binary } from '../../parse/pratt.js';

const ASSIGN = 20;

binary('=>', ASSIGN, true);
