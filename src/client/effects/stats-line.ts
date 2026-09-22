import type { ReconcilerTask } from '../core/reconciler-core.ts'

// The official conversation status row (turns / steps / LLM time / TTFT /
// cache) has a hashed class, so the stylesheet cannot target it directly.
// Mark the exact row on narrow screens by text: a [class*=_root] that
// carries the metrics text and no composer input (textarea or the
// data-composer-input Lexical node; the composer card also ends in
// _root and can mention turns in its model line). The CSS then lays the
// marked row out as ONE horizontally scrolling line with every metric
// reachable.
// Fast-path predicate: is the previously marked strip still alive in place?
// Re-verifying one anchor per flush is O(1); the full-tree hunt in mark()
// grows with the conversation and runs on every streaming token.
export function statsAnchorAlive(el: Element | null): boolean {
  if (el === null || !el.isConnected) return false
  if (el.closest('[data-phase]') === null) return false
  // The strip must stay inside the composer stack, but it need not be a
  // DIRECT child of it: 0.1.5 nests the status row (bOPqQW_root) under the
  // composer card wrapper (uV2eYG_root), so the marked element sits one level
  // deeper than on rc.2 hosts. Ancestry is still the right test — only the
  // marker's own subtree position changed, not its container relationship.
  return el.closest('[class*="_composerStack"]') !== null
}

export function createStatsLineTask(): ReconcilerTask {
  // The composer root renders the TPS readout ("TPS 89.4 tok/s") as its
  // own row BELOW the status strip; fold it into the strip so every
  // metric scrolls together. The suite re-renders its own tree, so this
  // must be idempotent and re-run on every mutation. Where the readout
  // came from is recorded so disposal can put it back — on a
  // narrow→wide transition the desktop layout must be the official one
  // again, and `[data-mobile-nav="stats"]` is not covered by the
  // desktop hide rules.
  let tpsOrigin: { parent: Node; next: Node | null } | null = null
  const moveTps = (stats: Element): void => {
    if ([...stats.children].some((c) => /^TPS\s+\d/.test((c.textContent ?? '').trim()))) return
    const stack = stats.closest('[class*="_composerStack"]')
    if (stack === null) return
    for (const el of stack.querySelectorAll('div')) {
      const text = (el.textContent ?? '').trim()
      if (!/^TPS\s+\d/.test(text)) continue
      if (el.children.length > 0) continue
      // The composer stack can be rebuilt by React between mutations:
      // refresh the origin every time we actually move the TPS readout, so
      // disposal returns it where it currently belongs.
      if (el.parentElement !== null) {
        tpsOrigin = { parent: el.parentElement, next: el.nextSibling }
      }
      stats.appendChild(el)
      return
    }
  }
  // 2026-09-23（店主最终确认）：**环要、百分比数字不要** —— 把这块挪进输入框行
  // 的右簇（模型/麦克风旁），再由 CSS 用 font-size:0 只留环、隐掉 "45%" 文本。
  // 它原本独占统计行右侧 63px + 12px 间距；挪走后统计条拿满整宽 326px，
  // 「轮次·步数·tok/s」+「tok 总量·缓存命中」约 316px 完整放下，不滚动也不省略。
  // 与 moveTps 同款：幂等 + 记录原位，dispose（宽屏档）时放回官方布局。
  let ringOrigin: { parent: Node; next: Node | null } | null = null
  const moveRing = (stats: Element): void => {
    const holder = stats.parentElement
    const dock = holder === null ? null : holder.parentElement
    if (dock === null) return
    const ring = [...dock.children].find(
      (child) => !child.contains(stats) && /\d\s*%/.test(child.textContent ?? ''),
    )
    if (ring === undefined) return
    const row = document.querySelector('[data-composer-card] [class*="_row"] [class*="_trailing"]')
    if (row === null) return
    if (ring.parentElement === row) return
    if (ring.parentElement !== null) {
      ringOrigin = { parent: ring.parentElement, next: ring.nextSibling }
    }
    ring.setAttribute('data-mobile-nav', 'stats-ring')
    row.insertBefore(ring, row.querySelector(':scope > [class*="_primary"]'))
  }
  const mark = (): void => {
    // Fast path: the marked strip usually survives React rebuilds between
    // tokens; re-verifying the anchor is O(1) while the full-tree hunt below
    // grows with the conversation. moveTps still re-runs so a rebuilt TPS
    // readout is re-folded.
    const anchor = document.querySelector('[data-mobile-nav="stats"]')
    if (anchor !== null && statsAnchorAlive(anchor)) {
      moveTps(anchor)
      moveRing(anchor)
      return
    }
    // Stale marker on a node that left the composer stack/phase context:
    // drop it so the slow path can re-anchor cleanly.
    anchor?.removeAttribute('data-mobile-nav')
    // Scope decision: the status row is a DESCENDANT of the composer stack,
    // not necessarily its child. On rc.2 hosts it is a direct child (its own
    // `_root`); on 0.1.5 the composer card wrapper (uV2eYG_root) sits between
    // the stack and the row (bOPqQW_root), so requiring a direct child made
    // the hunt permanently miss and the strip was never marked (measured: row
    // present at 16,814 carrying "8 turns 582 steps · 103 tok/s" while
    // [data-mobile-nav="stats"] was absent). Body blocks outside the stack are
    // still skipped by the containment test below.
    const stack = document.querySelector('[class*="_composerStack"]')
    if (stack === null) return
    for (const root of stack.querySelectorAll('[class*="_root"]')) {
      // The status row lives inside the composer stack. The query is already
      // scoped to the stack, so every candidate is inside it by construction —
      // message-area blocks that mention turns/steps never enter this loop. (A
      // `stack.contains(root)` guard stood here and its comment claimed to skip
      // those blocks; it was unreachable.)
      // The todo plan strip also lives in the composer stack and its root
      // ends in _root. Its items may legitimately contain "步"/"steps" in
      // their text, so never mistake it (or any interactive dock panel)
      // for the stats strip.
      if (root.matches('[data-testid="todo-panel"]')) continue
      // Dock panels are skipped by never marking a candidate whose buttons are
      // actionable controls. 0.1.5 renders the status row ITSELF as two
      // popover buttons (bOPqQW_pill, aria-haspopup="dialog"), so an
      // "any button" guard excluded the one row this task exists to mark
      // (measured: bOPqQW_root rejected solely by hasButton, marker count 0).
      // Every popover button counts as a status widget: the composer's real
      // controls (model bar, context meter) carry no metrics text and are
      // filtered by the text test above, and a panel with an actionable button
      // still fails here.
      const buttons = root.querySelectorAll('button')
      if (buttons.length > 0 && ![...buttons].every((button) => button.getAttribute('aria-haspopup') !== null)) continue
      const text = root.textContent ?? ''
      if (!/(turns|steps|\bLLM\b|轮|步)/.test(text)) continue
      // Composer card must never be mistaken for the status strip; exclude
      // its input region across both composer DOMs (textarea / Lexical
      // contentEditable marked data-composer-input).
      if (root.querySelector('textarea, [data-composer-input]') !== null) continue
      root.setAttribute('data-mobile-nav', 'stats')
      moveTps(root)
      moveRing(root)
      return
    }
  }
  // Scope decision: the TPS readout updates are childList/characterData text
  // mutations inside the composer stack, so this task can only wake on the
  // tree key. A subtree-scoped observer would need one observer per
  // container, which the single full-tree observer design intentionally
  // avoids; the expensive composer-stack scan stays the cost of re-anchoring
  // markers that React rebuilds every token.
  return {
    name: 'stats-line',
    scopes: ['*'],
    ensure: mark,
    dispose: () => {
      // Hand the official layout back: return the TPS readout to its own
      // row, then drop the marker that drives the one-line strip.
      if (tpsOrigin !== null && tpsOrigin.parent.isConnected) {
        // Find the TPS readout only inside the marked stats strip we moved
        // it into — a global text search could pick up a different element.
        for (const stats of document.querySelectorAll('[data-mobile-nav="stats"]')) {
          const tps = [...stats.querySelectorAll('div')].find(
            (el) => el.children.length === 0 && /^TPS\s+\d/.test((el.textContent ?? '').trim()),
          )
          if (tps !== undefined) {
            tpsOrigin.parent.insertBefore(tps, tpsOrigin.next)
            break
          }
        }
      }
      for (const el of document.querySelectorAll('[data-mobile-nav="stats"]')) {
        el.removeAttribute('data-mobile-nav')
      }
      // 上下文环放回统计行旁边，宽屏档恢复官方布局。
      if (ringOrigin !== null && ringOrigin.parent.isConnected) {
        for (const ring of document.querySelectorAll('[data-mobile-nav="stats-ring"]')) {
          ringOrigin.parent.insertBefore(ring, ringOrigin.next)
          ring.removeAttribute('data-mobile-nav')
        }
      }
      ringOrigin = null
      tpsOrigin = null
    },
  }
}