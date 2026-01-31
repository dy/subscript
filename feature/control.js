// Control flow symbols (shared by loop, group, switch, try, function)
// RETURN is array to hold value - reused, no allocation per throw
export const BREAK = Symbol('break'), CONTINUE = Symbol('continue'), RETURN = [];
