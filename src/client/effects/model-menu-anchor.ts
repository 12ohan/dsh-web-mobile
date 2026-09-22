import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { installMobileEffect } from './phone-chrome.ts'

/**
 * 模型 / 推理等级菜单的锚点修正（2026-09-23 店主："这个模型打开，是不是有点偏左边？"）。
 *
 * 真机取证（360×754）：
 *   MENU  box=12,605,246,74   class=_7KE1Ra_menu  role=menu  aria-label="模型与推理等级"
 *         style="left: 12px; top: 605px"  position:fixed  **parent=BODY**（portal 出去的）
 *   TRIG  box=219,687,30,28
 *
 * 宿主按「菜单右缘贴触发器右缘」定位。模型触发器现在是图标形态、坐在输入框右半边
 * （219..249），246 宽的菜单就被推到 x=12..258 —— 菜单中心 x=135 vs 触发器中心 x=234，
 * **偏左 99px**，视觉上整块贴在左半屏。
 *
 * 本插件早先用 CSS 居中过它（`left:50% + translateX(-50%)`），但那条规则锚在
 * `[class*="_root"]:has(> [class*="_trigger"]) > [class*="_menu"]` —— 菜单 portal 到 body 之后
 * 这条子代链断掉，规则成了**死规则**（2026-09-23 才发现，之前一直以为它在生效）。
 *
 * 修法：菜单出现时按「菜单中心对齐触发器中心、并夹在视口内 GUTTER」重写它的 inline `left`
 * （只改 left，`top` 保持宿主机算好的值）。只认模型菜单的哈希锚点，其它菜单一律不碰。
 *
 * 为什么不用 MutationObserver：会话在流式输出，`subtree` 观察等于每帧扫全场。这里改成
 * 「点击 / 滚动 / 改变尺寸」时补几次 rAF 后的落位 —— 成本 O(1)，且足够盖住宿主的多次写入。
 */

/** 模型触发器（图标形态的 chip）。 */
const MODEL_TRIGGER = '[class*="_7KE1Ra_trigger"]'

/** 模型 / 推理等级菜单（portal 在 body 下）。 */
const MODEL_MENU = '[class*="_7KE1Ra_menu"]'

/** 贴边留白。 */
const GUTTER = 8

/** 宿主在打开动画/二次测量里会再写位置，补几次收尾（毫秒）。 */
const SETTLE_MS = [0, 60, 200]

export function installModelMenuAnchor(ctx: ClientContext): void {
  installMobileEffect(ctx, 'dsh-web-mobile: model menu anchor', () => {
    let raf = 0
    const timers: number[] = []

    const visible = (el: Element): boolean => {
      const box = el.getBoundingClientRect()
      return box.width > 0 && box.height > 0
    }

    const place = (): void => {
      let menu: HTMLElement | null = null
      for (const el of document.querySelectorAll<HTMLElement>(MODEL_MENU)) {
        if (visible(el)) {
          menu = el
          break
        }
      }
      if (menu === null) return
      const trigger = document.querySelector<HTMLElement>(MODEL_TRIGGER)
      if (trigger === null) return
      const anchor = trigger.getBoundingClientRect()
      const width = menu.getBoundingClientRect().width
      const viewport = document.documentElement.clientWidth
      const max = Math.max(GUTTER, viewport - width - GUTTER)
      const left = Math.min(Math.max(anchor.left + anchor.width / 2 - width / 2, GUTTER), max)
      const next = `${Math.round(left)}px`
      // 只在真的不同时才写：避免和宿主来回抢同一帧。
      if (menu.style.left !== next) menu.style.left = next
    }

    const schedule = (): void => {
      if (raf !== 0) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        place()
      })
    }

    const scheduleSettle = (): void => {
      schedule()
      for (const delay of SETTLE_MS) timers.push(window.setTimeout(schedule, delay))
      // 计时器只留最近一轮，避免长会话里越积越多。
      while (timers.length > SETTLE_MS.length * 2) {
        const stale = timers.shift()
        if (stale !== undefined) window.clearTimeout(stale)
      }
    }

    // 打开菜单是一次点击；菜单里选项被点选后宿主会重渲染、可能再写一次位置，
    // 所以任何点击都补一轮（place() 内部只在菜单可见时才动作）。
    document.addEventListener('pointerdown', scheduleSettle, true)
    document.addEventListener('click', scheduleSettle, true)
    // 键盘（旋转屏幕 / 输入法弹出改变可视高度）后视口会变，重新夹一次。
    window.addEventListener('resize', scheduleSettle)
    document.addEventListener('scroll', scheduleSettle, true)

    return () => {
      document.removeEventListener('pointerdown', scheduleSettle, true)
      document.removeEventListener('click', scheduleSettle, true)
      window.removeEventListener('resize', scheduleSettle)
      document.removeEventListener('scroll', scheduleSettle, true)
      if (raf !== 0) window.cancelAnimationFrame(raf)
      for (const timer of timers) window.clearTimeout(timer)
      timers.length = 0
    }
  })
}
