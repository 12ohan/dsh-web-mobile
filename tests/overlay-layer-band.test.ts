// Drawer-back fix: sheets portaled into the AppFrame overlayLayer
// (position:absolute + z-index:20 — its own stacking context) can never
// out-rank the drawer column's 1300 in the root context, no matter what
// z-index the sheet itself carries. Measured 2026-09-22 (Playwright, 390px,
// drawer open): a layer child lost elementFromPoint to drawer elements at
// z auto AND z 9999 alike; only raising the layer ROOT to 1400 revealed it.
// This pins the class fix: the overlayLayer raise must stay drawer-open-
// gated, inside the mobile popover band, at the 1400 band value.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = readFileSync(join(ROOT, 'src/client/styles/base.css.ts'), 'utf8')

const bandStart = BASE.indexOf('popover band above the open drawer')
const bandEnd = BASE.indexOf('/* Floating fallback button', bandStart)
const band =
  bandStart !== -1 && bandEnd > bandStart ? BASE.slice(bandStart, bandEnd) : ''

test('overlayLayer band raise lives in the mobile popover band section', () => {
  assert.notEqual(bandStart, -1, 'popover band marker not found in base.css.ts')
  assert.ok(bandEnd > bandStart, 'popover band end marker not found')
  assert.match(band, /@media \(max-width: 1023px\) and \(pointer: coarse\)/)
})

test('overlayLayer raise is drawer-open-gated at the 1400 band', () => {
  const at = band.indexOf('[class*="_overlayLayer"]')
  assert.notEqual(at, -1, 'overlayLayer rule missing from the popover band')
  // The gate must belong to THIS rule, not a sibling's: nothing may close a
  // block between the nearest gate and the selector.
  const gate = 'body:has([data-mobile-nav="frame"]:not([data-sidebar-collapsed]))'
  const gateAt = band.lastIndexOf(gate, at)
  assert.ok(gateAt !== -1, 'overlayLayer raise must be drawer-open-gated')
  assert.doesNotMatch(
    band.slice(gateAt, at),
    /\}/,
    'gate must belong to the overlayLayer rule itself',
  )
  assert.match(band, /\[class\*="_overlayLayer"\]\s*\{\s*z-index: 1400 !important;\s*\}/)
})
