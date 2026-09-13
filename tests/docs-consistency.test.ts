// Documentation consistency guard for the knowledge layer.
//
// Keeps three drift classes out of the tree:
// 1. AGENTS.md must reference only tracked assets that actually exist
//    (dead-reference class — the original multi-maintainer audit P0-1).
// 2. AGENTS.md must stay within the session-instruction budget (65536
//    bytes); narrative overflow belongs in docs/maintenance/pitfalls.md.
// 3. The machine-readable contract layer (docs/upstream/compat-contracts.json)
//    and the pitfalls archive (docs/maintenance/pitfalls.md) must stay
//    parseable and non-empty, because the condensed AGENTS.md entries point
//    into them.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const readRepoFile = (relPath: string) => readFile(join(root, relPath), 'utf8')

const SESSION_INSTRUCTION_BUDGET_BYTES = 65_536

const REFERENCED_PATH_PATTERN =
  /(scripts\/probes\/[\w.-]+\.mjs|scripts\/cdp-[\w-]+\.mjs|docs\/specs\/[\w-]+\.md|docs\/audits\/[\w-]+\.md|docs\/upstream\/[\w-]+\.(?:md|json)|docs\/maintenance\/[\w-]+\.md)/g

test('AGENTS.md references only tracked assets that exist', async () => {
  const agents = await readRepoFile('AGENTS.md')
  const referenced = new Set(agents.match(REFERENCED_PATH_PATTERN) ?? [])
  assert.ok(
    referenced.size >= 10,
    `expected a healthy reference graph, found only ${referenced.size} references`,
  )
  for (const relPath of referenced) {
    await stat(join(root, relPath))
  }
})

test('AGENTS.md stays within the session instruction budget', async () => {
  const { size } = await stat(join(root, 'AGENTS.md'))
  assert.ok(
    size <= SESSION_INSTRUCTION_BUDGET_BYTES,
    `AGENTS.md is ${size} bytes (budget ${SESSION_INSTRUCTION_BUDGET_BYTES}) — move narrative into docs/maintenance/pitfalls.md`,
  )
})

test('compat-contracts.json entries are well-formed', async () => {
  const parsed = JSON.parse(await readRepoFile('docs/upstream/compat-contracts.json'))
  assert.ok(Array.isArray(parsed.contracts), 'contracts must be an array')
  assert.ok(parsed.contracts.length >= 20, 'expected the full runbook §2 contract set')
  for (const contract of parsed.contracts) {
    assert.ok(contract.id, 'contract missing id')
    assert.ok(contract.needle, `contract ${contract.id} missing needle`)
    assert.ok(
      contract.kind === 'hash' || contract.kind === 'marker',
      `contract ${contract.id} has unknown kind ${contract.kind}`,
    )
  }
})

test('pitfalls archive mirrors the condensed AGENTS.md pointers', async () => {
  const agents = await readRepoFile('AGENTS.md')
  const archive = await readRepoFile('docs/maintenance/pitfalls.md')
  const pointers = (agents.match(/docs\/maintenance\/pitfalls\.md` §/g) ?? []).length
  const sections = (archive.match(/^## /gm) ?? []).length
  assert.ok(sections >= 15, `archive has only ${sections} sections`)
  assert.ok(pointers >= 15, `AGENTS.md has only ${pointers} archive pointers`)
})

// Cross-generation safety of the rules added for the 0.1.5 host. The plugin
// supports every host generation at once (the installed one plus the older
// rc.2 line), so a fix aimed at a new host must be inert on an old one. The
// mechanism that buys that is structural, and it is easy to break by moving a
// rule out of the mobile media block or by anchoring it on something the old
// host also has under a different meaning:
// - every 0.1.5-specific rule lives in a @media (… pointer: coarse) block and
//   is scoped under [data-mobile-nav="frame"] [data-phase], which only exists
//   while the plugin itself is active on a touch device;
// - hash-anchored rules use substring matching and are inert when the class is
//   absent (the old host ships different hashes), never negative selectors.
test('0.1.5-era rules stay scoped to the mobile branch', async () => {
  const { LAYOUT_CSS } = await import('../src/client/styles/layout.css.ts')
  const { MISC_CSS } = await import('../src/client/styles/misc.css.ts')
  const { COMPAT_CSS } = await import('../src/client/styles/compat.css.ts')
  const sheets = [LAYOUT_CSS, MISC_CSS, COMPAT_CSS]

  // 1. The two selectors that only 0.1.5 has must be present…
  const wSkVaW = sheets.filter((css) => css.includes('wSkVaW_headerUtilities'))
  assert.ok(wSkVaW.length > 0, 'the header-utilities rules disappeared')
  // …and every mention must be scoped under the mobile frame marker, so an old
  // host (and any desktop window) can never match them.
  for (const css of sheets) {
    for (const line of css.split('\n')) {
      if (!line.includes('wSkVaW_') || !line.includes('{')) continue
      assert.ok(
        line.includes('[data-mobile-nav="frame"]'),
        'a wSkVaW_ rule escaped the mobile frame scope: ' + line.trim(),
      )
    }
  }

  // 2. No rule may target a bare hash prefix without a property context: a
  // hash-only selector would also match unrelated elements on a newer host.
  for (const css of sheets) {
    for (const line of css.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed.endsWith('{') || trimmed.startsWith('@') || trimmed.startsWith('/*')) continue
      assert.ok(
        !/^\.[A-Za-z0-9_-]+_\s*\{$/.test(trimmed),
        'a bare hash class selector has no owner scope: ' + trimmed,
      )
    }
  }
})

// CSS files are TypeScript template literals, so a Markdown backtick inside a
// comment terminates the template early and tsc reports a confusing TS1005.
// This bit the same file three times during the 0.1.5 work; the check is cheap
// and the failure mode is otherwise cryptic.
test('CSS template literals carry no stray backticks', async () => {
  for (const file of ['base.css.ts', 'layout.css.ts', 'compat.css.ts', 'misc.css.ts']) {
    const source = await readRepoFile('src/client/styles/' + file)
    const ticks = (source.match(/`/g) ?? []).length
    assert.equal(ticks, 2, file + ' must contain exactly the two template delimiters, found ' + ticks)
  }
})
