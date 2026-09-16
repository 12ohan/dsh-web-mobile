import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const source = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')

// The entry is read as text rather than imported: tsc with moduleResolution
// "bundler" leaves the host half's relative specifiers as the `.js` spelling
// tsc will emit (`./compress.js`), and Node's ESM resolver does not map that
// back to `src/compress.ts` — so `import('../src/index.ts')` dies on
// ERR_MODULE_NOT_FOUND before any export is visible. The built entry, which
// does resolve, is checked by the lib probe in the task runbook instead.
test('the host entry declares the documented plugin name', () => {
  const declaredName = source.match(/export const name = ['"]([^'"]+)['"]/)
  assert.equal(declaredName?.[1], pkg.name)
  assert.match(source, /export function apply\(/)
})
