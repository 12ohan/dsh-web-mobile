// The files opener ([data-mobile-nav="files"]) must sit in the header's
// top-right corner, mirroring the directory toggle in the top-left one.
//
// The host mounts the session-header actions slot inside its title cluster,
// which reserves padding-right: 44px for a utilities seat that stays empty on
// mobile, so an in-flow button can never reach the right edge - measured at
// 390px before the fix: button [300,16,28,28], i.e. 62px of bare header to its
// right (2026-09-14 phone-side report). layout.css pins it absolutely (right
// 8px, top 12px) in the mobile branch, the same seat the toggle uses on the
// left.
//
// Scenes: the rule itself (mobile branch only), the pinned geometry against
// both viewport edges, hit-testability, the toggle's unchanged seat, the shift
// the frame's safe-area padding applies to both controls, and the absence of
// any overlap with the host's utilities seat. Headless has no safe-area inset,
// so scene 3 simulates the status bar with inline frame padding.
//
// Env: DSH_PROBE_URL (default http://127.0.0.1:3080/), DSH_PROBE_SESSION_ID,
// DSH_PROBE_COOKIE (name=value, for an authenticated instance), DSH_PROBE_INSET
// (default 47), DSH_PROBE_CHROME.
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const URL_ = process.env.DSH_PROBE_URL || 'http://127.0.0.1:3080/'
const SESSION_ID = process.env.DSH_PROBE_SESSION_ID || ''
const COOKIE = process.env.DSH_PROBE_COOKIE || ''
const INSET = Number(process.env.DSH_PROBE_INSET || 47)
const CHROME = process.env.DSH_PROBE_CHROME || 'chromium'
const PORT = 9357

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const failures = []
const record = (ok, name, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' ' + detail : ''}`)
  if (!ok) failures.push(name)
}
async function waitFor(fn, label, timeoutMs) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) { const v = await fn(); if (v) return v; await sleep(300) }
  throw new Error(label + ' timeout')
}

async function main() {
  const dir = await mkdtemp(join(homedir(), 'tmp', 'cdp-files-pin-'))
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, 'about:blank',
  ], { env: { ...process.env, TMPDIR: dir, XDG_RUNTIME_DIR: dir }, stdio: 'ignore' })

  try {
    let wsUrl
    await waitFor(async () => {
      try {
        const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
        wsUrl = list.find((t) => t.type === 'page')?.webSocketDebuggerUrl
        return wsUrl
      } catch { return null }
    }, 'chrome boot', 30000)

    const ws = new WebSocket(wsUrl)
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
    let id = 0
    const pending = new Map()
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id !== undefined && pending.has(m.id)) {
        const p = pending.get(m.id); pending.delete(m.id)
        m.error ? p.rej(new Error(m.error.message)) : p.res(m.result)
      }
    }
    const send = (method, params = {}) => new Promise((res, rej) => {
      const mid = ++id; pending.set(mid, { res, rej })
      ws.send(JSON.stringify({ id: mid, method, params }))
    })
    const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value

    await send('Page.enable')
    await send('Runtime.enable')
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
    if (COOKIE) {
      const eq = COOKIE.indexOf('=')
      await send('Network.setCookie', { name: COOKIE.slice(0, eq), value: COOKIE.slice(eq + 1), url: URL_ })
    }
    if (SESSION_ID) {
      await send('Page.addScriptToEvaluateOnNewDocument', {
        source: `localStorage['dsh.sessions.current'] = JSON.stringify({sessionId:${JSON.stringify(SESSION_ID)}})`,
      })
    }
    await send('Page.navigate', { url: URL_ })
    await waitFor(async () => await evaluate(`document.querySelector('[data-mobile-nav="frame"]') !== null`), 'mobile frame', 30000)
    await waitFor(async () => await evaluate(`document.querySelector('[data-mobile-nav="files"]') !== null`), 'files opener', 20000)
    await sleep(500)

    // ---- 1. the rule lives in the mobile branch ----
    const rawRules = await evaluate(`(() => {
      const hits = []
      const walk = (list, media) => {
        for (const r of list) {
          try {
            if (r.selectorText) {
              if (r.selectorText === '[data-mobile-nav="files"]') hits.push({ css: r.style.cssText, media })
              continue
            }
            if (r.cssRules) walk(r.cssRules, r.conditionText || media)
          } catch {}
        }
      }
      for (const sheet of document.styleSheets) {
        const owner = sheet.ownerNode
        if (!owner || owner.dataset?.plugin !== 'dsh-web-mobile') continue
        try { walk(sheet.cssRules, '') } catch {}
      }
      return JSON.stringify(hits)
    })()`)
    const rules = JSON.parse(rawRules)
    const rule = rules.find((r) => /position:\s*absolute/.test(r.css))
    record(Boolean(rule), '1.pin-rule-injected', JSON.stringify(rules.map((r) => r.css.slice(0, 48))))
    record(Boolean(rule) && /right:\s*8px/.test(rule.css), '1.pin-rule-declaration', rule ? rule.css : 'absent')
    record(Boolean(rule) && /max-width:\s*1023px/.test(rule.media) && /pointer:\s*coarse/.test(rule.media), '1.rule-in-mobile-branch', rule ? rule.media : 'absent')

    // ---- 2. pinned to the right corner, level with the toggle ----
    const measure = `(() => {
      const box = (sel) => { const el = document.querySelector(sel); if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
      const files = document.querySelector('[data-mobile-nav="files"]')
      const fb = files.getBoundingClientRect()
      const hit = document.elementFromPoint(Math.round(fb.x + fb.width / 2), Math.round(fb.y + fb.height / 2))
      const ut = document.querySelector('[class*="_headerUtilities"]')
      const ub = ut ? ut.getBoundingClientRect() : null
      const overlap = ub !== null && ub.width > 0 && fb.x < ub.right && ub.x < fb.right && fb.y < ub.bottom && ub.y < fb.bottom
      return JSON.stringify({
        files: box('[data-mobile-nav="files"]'), toggle: box('[data-mobile-nav="toggle"]'),
        pos: getComputedStyle(files).position, vw: innerWidth,
        hitIsFiles: hit === files || (hit !== null && files.contains(hit)),
        utilities: ub ? [Math.round(ub.x), Math.round(ub.width)] : null, overlap
      })
    })()`
    const base = JSON.parse(await evaluate(measure))
    record(base.pos === 'absolute', '2.files-out-of-flow', `position=${base.pos}`)
    record(base.files[0] + base.files[2] === base.vw - 8, '2.files-right-edge-pinned', `right edge ${base.files[0] + base.files[2]} of ${base.vw}`)
    record(base.toggle[0] === 8, '2.toggle-still-left-pinned', `toggle x=${base.toggle[0]}`)
    record(base.files[1] === base.toggle[1], '2.corner-controls-level', `files top=${base.files[1]} toggle top=${base.toggle[1]}`)
    record(base.hitIsFiles, '2.files-hit-testable', 'elementFromPoint at its centre returns the button')
    record(base.overlap === false, '2.no-utilities-overlap', base.utilities === null ? 'utilities seat absent' : `utilities x=${base.utilities[0]} w=${base.utilities[1]}`)

    // ---- 3. the frame's safe-area padding moves both corner controls together ----
    await evaluate(`(() => { document.querySelector('[data-mobile-nav="frame"]').style.setProperty('padding-top', '${INSET}px', 'important'); return true })()`)
    await sleep(300)
    const sim = JSON.parse(await evaluate(measure))
    record(sim.files[1] === base.files[1] + INSET && sim.toggle[1] === base.toggle[1] + INSET,
      '3.both-corners-follow-the-inset', `files ${base.files[1]} -> ${sim.files[1]}, toggle ${base.toggle[1]} -> ${sim.toggle[1]} (inset ${INSET})`)
    record(sim.files[0] + sim.files[2] === sim.vw - 8, '3.still-right-pinned-with-inset', `right edge ${sim.files[0] + sim.files[2]}`)
    await evaluate(`(() => { document.querySelector('[data-mobile-nav="frame"]').style.removeProperty('padding-top'); return true })()`)
  } finally {
    chrome.kill()
    await sleep(300)
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }

  if (failures.length > 0) { console.log(`FAILED: ${failures.join(', ')}`); process.exitCode = 1 } else { console.log('ALL PASS') }
}
main().catch((e) => { console.error('ERR', e); process.exitCode = 1 })
