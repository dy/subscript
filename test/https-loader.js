// Node.js loader for https:// imports
// Usage: node --import ./test/https-loader.js test/benchmark.js

import { register } from 'node:module';

register(new URL('./https-hooks.js', import.meta.url));
