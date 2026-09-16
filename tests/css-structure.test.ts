// The structural checker (scripts/css-structure-check.mjs) was a manual-only
// gate: nothing in the repo invoked it, so the 16 fatals it exists to catch -
// a media block written at column zero, a duplicated media query, a selector
// split across rules - could all come back with every gate still green. This
// wires its exit code into test:core, which is the gate CI actually runs.
//
// Two info findings are expected and reviewed on purpose (a progressive-
// enhancement fallback pair and one deliberate selector split), so the
// assertion is on the fatal count rather than on empty output. The module
// count is asserted too: a resolver that finds no files would otherwise
// report zero fatals and pass vacuously.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const SCRIPT = fileURLToPath(new URL('../scripts/css-structure-check.mjs', import.meta.url))

test('the four style modules keep zero structural fatals', () => {
  const out = execFileSync(process.execPath, [SCRIPT], { encoding: 'utf8' })
  assert.match(out, /4 modules/)
  assert.match(out, /0 fatal/)
})
