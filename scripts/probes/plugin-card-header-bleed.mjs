// Local CDP regression probe: settings plugin-card header bleed (2026-09-05).
// Asserts the settings toolbar rules (layout.css.ts) stay structurally anchored
// to the dialog toolbar and never touch plugin card headers in the Plugins
// section or the dsh-web-ui-all group pages. Run with the same env family as
// scripts/cdp-probe.mjs: DSH_PROBE_SESSION_ID, DSH_PROBE_URL (default
// http://127.0.0.1:3080/), DSH_PROBE_CHROME (default chromium),
// DSH_PROBE_TIMEOUT_MS.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import net from 'node:net';
import { homedir } from 'node:os';
import { join } from 'node:path';

const HOME = homedir();
const TMPDIR = join(HOME, 'tmp', 'bl');
const XDG = join(HOME, 'tmp', 'bx');
mkdirSync(TMPDIR, { recursive: true });
mkdirSync(XDG, { recursive: true });
mkdirSync(join(TMPDIR, 'p' + Date.now()), { recursive: true });

const results = [];
const pass = (name, detail = '') => { results.push({ status: 'PASS', name, detail }); console.log('PASS ' + name + (detail ? ' ' + detail : '')); };
const fail = (name, detail = '') => { results.push({ status: 'FAIL', name, detail }); console.log('FAIL ' + name + (detail ? ' ' + detail : '')); };
const check = (name, condition, detail = '') => (condition ? pass : fail)(name, detail);

function readConfig(env = process.env) {
  const sessionId = env.DSH_PROBE_SESSION_ID?.trim();
  if (!sessionId) throw new Error('DSH_PROBE_SESSION_ID is required');
  const parsedUrl = new URL(env.DSH_PROBE_URL || 'http://127.0.0.1:3080/');
  const timeoutMs = Number(env.DSH_PROBE_TIMEOUT_MS || 45000);
  return { url: parsedUrl.href, sessionId, chromePath: env.DSH_PROBE_CHROME || 'chromium', timeoutMs };
}

function allocatePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(label, timeoutMs, probe) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await probe();
    if (value) return value;
    await sleep(250);
  }
  throw new Error(label + ' timed out');
}

const config = readConfig();
const port = await allocatePort();
const chrome = spawn(config.chromePath, [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
  '--remote-debugging-port=' + port,
  '--user-data-dir=' + join(TMPDIR, 'p' + Date.now()),
], { env: { ...process.env, TMPDIR, XDG_RUNTIME_DIR: XDG, HOME } });
let wsUrl = null;
for (let i = 0; i < 60; i++) {
  try {
    const res = await fetch('http://127.0.0.1:' + port + '/json');
    const pages = await res.json();
    const page = pages.find((p) => p.type === 'page');
    if (page) { wsUrl = page.webSocketDebuggerUrl; break; }
  } catch {}
  await sleep(500);
}
if (!wsUrl) { console.log('FAIL chrome-boot: CDP endpoint never came up'); process.exitCode = 1; process.exit(1); }

const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let nextId = 0;
const pending = new Map();
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id !== undefined) {
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result);
  }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result.value;
};

try {
  await send('Page.enable');
  if (process.env.DSH_PROBE_COOKIE) {
    const raw = process.env.DSH_PROBE_COOKIE;
    const eq = raw.indexOf('=');
    await send('Network.enable');
    await send('Network.setCookie', { name: raw.slice(0, eq), value: raw.slice(eq + 1), url: config.url });
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage['dsh.sessions.current'] = JSON.stringify({sessionId:'" + config.sessionId + "'})" });
  await send('Page.navigate', { url: config.url });
  await waitFor('mobile frame', config.timeoutMs, () => evaluate("!!document.querySelector('[data-mobile-nav=frame]')"));
  await sleep(2500);
  await evaluate("(() => { document.querySelector('button.VOzbGW_trigger')?.click(); })()");
  await waitFor('settings dialog', config.timeoutMs, () => evaluate("!!document.querySelector('[aria-modal=true]')"));
  await evaluate("(() => { const c = [...document.querySelectorAll('button.VOzbGW_navCell')].find(b => (b.textContent||'').trim() === 'Plugins'); c?.click(); })()");
  await sleep(1500);

  const PROPS = "(el) => { const c = getComputedStyle(el); return { justify: c.justifyContent, gap: c.gap, padding: c.padding, minHeight: c.minHeight }; }";
  const plugs = await evaluate("(() => { const P = " + PROPS + "; const headers = [...document.querySelectorAll('[aria-modal=true] .YyYd_a_header')].map(P); const chevrons = [...document.querySelectorAll('[aria-modal=true] .YyYd_a_header > :last-child')].map(el => { const c = getComputedStyle(el); const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), radius: c.borderRadius, bg: c.backgroundColor }; }); const toolbar = document.querySelector('[aria-modal=true] .VOzbGW_header'); const tb = toolbar ? (() => { const c = getComputedStyle(toolbar); return { justify: c.justifyContent, parent: (toolbar.parentElement.className||'').toString().slice(0, 30) }; })() : null; const close = document.querySelector('[aria-modal=true] .VOzbGW_header > :last-child'); const cl = close ? (() => { const c = getComputedStyle(close); const r = close.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), radius: c.borderRadius, bg: c.backgroundColor }; })() : null; return { headers, chevrons, toolbar: tb, close: cl }; })()");
  check('boot.settings-dialog', !!plugs, 'modal opened');
  check('plugins.card-headers-present', (plugs.headers?.length ?? 0) >= 3, 'found ' + plugs.headers?.length + ' (0.1.5-rc.2 实测 4 张)');
  const cardOk = (h) => h && h.justify === 'normal' && h.gap === '12px' && h.padding === '14px 16px' && h.minHeight === '0px';
  check('plugins.card-headers-restored', plugs.headers?.every(cardOk), JSON.stringify(plugs.headers));
  const chevOk = (c) => c && c.w === 14 && c.h === 14 && (c.radius === '0px') && (c.bg === 'rgba(0, 0, 0, 0)');
  // 0.1.5-rc.2 起手机端卡头不再画 14px 箭头（末子节点 0x0）：只对**实际绘制**的节点断言模板，
  // 否则这条会在上游改渲染时变成对空集合的永真断言。见 pitfalls §工具栏锚定。
  const painted = (list) => (list || []).filter((c) => c && c.w > 0 && c.h > 0);
  const chevPainted = painted(plugs.chevrons);
  check('plugins.card-chevrons-restored', chevPainted.every(chevOk), 'painted=' + chevPainted.length + '/' + (plugs.chevrons?.length ?? 0) + ' ' + JSON.stringify(chevPainted));
  check('toolbar.still-flex-end', plugs.toolbar?.justify === 'flex-end', JSON.stringify(plugs.toolbar));
  check('toolbar.reparented-home', plugs.toolbar?.parent === 'VOzbGW_nav', 'parent=' + plugs.toolbar?.parent);
  const closePainted = plugs.close && plugs.close.w > 0 && plugs.close.h > 0;
  check('toolbar.close-circle-kept', closePainted
    ? (plugs.close.w === 32 && plugs.close.h === 32 && plugs.close.radius === '50%' && plugs.close.bg !== 'rgba(0, 0, 0, 0)')
    : true, closePainted ? JSON.stringify(plugs.close) : 'not painted on this breakpoint (0.1.5-rc.2 实测 0x0)');

  // 0.1.5-rc.2 起该 nav 标签是 'Web Plugins'（旧记法 'Web UI Plugins' 已失效）。
  const webuiLabelOk = await evaluate("(() => { const c = [...document.querySelectorAll('button.VOzbGW_navCell')].find(b => /^(Web Plugins|Web UI Plugins)$/.test((b.textContent||'').trim())); c?.click(); return !!c; })()");
  check('webui.nav-cell-present', webuiLabelOk, 'Web Plugins nav cell clicked');
  await sleep(1800);
  // 旧场景钉的是 dsh-web-all 五张分组卡头的硬编码哈希（Kwoi6G_/bpnj3G_/Jh0q7G_/jmhvDG_/rUBhvW_）。
  // 2026-09-18 实测：0.1.5-rc.2 + dsh-web-all 0.3.20 的该页**不渲染任何 [class*=_header] 卡头**
  // （全 modal 62 节点，只有工具栏 VOzbGW_header），且 bpnj3G_/jmhvDG_ 已改名——按结构测，不再记哈希。
  const webui = await evaluate("(() => { const P = " + PROPS + "; const all = [...document.querySelectorAll('[aria-modal=true] [class*=_header]')].filter(el => !/VOzbGW_header/.test(el.className||'')); const visible = all.filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); return { total: all.length, visible: visible.length, headers: visible.map(P), toolbar: !!document.querySelector('[aria-modal=true] .VOzbGW_header') }; })()");
  check('webui.page-has-toolbar', webui?.toolbar === true, 'non-vacuous anchor on this page');
  check('webui.card-headers-restored', webui.headers?.every(cardOk), 'painted card headers=' + webui.visible + '/' + webui.total + ' ' + JSON.stringify(webui.headers));
} catch (error) {
  fail('run', error.message);
} finally {
  try { ws.close(); } catch {}
  chrome.kill('SIGKILL');
}

const failCount = results.filter((r) => r.status === 'FAIL').length;
const passCount = results.filter((r) => r.status === 'PASS').length;
console.log('SUMMARY pass=' + passCount + ' fail=' + failCount + ' green=' + (failCount === 0));
process.exitCode = failCount === 0 ? 0 : 1;
