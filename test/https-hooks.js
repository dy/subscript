// HTTPS import hooks for Node.js
const cache = new Map();

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('https://')) {
    return { shortCircuit: true, url: specifier };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('https://')) {
    if (cache.has(url)) return cache.get(url);
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const source = await res.text();
    const result = { shortCircuit: true, format: 'module', source };
    cache.set(url, result);
    return result;
  }
  return nextLoad(url, context);
}
