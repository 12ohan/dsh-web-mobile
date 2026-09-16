# CSS 表面与结构审查（2026-09-15）· 发现清单 + 修复计划 + 再审查协议

> 基线分支 `fix/50-52-49-verified` @ `a7c4c97` · 四个样式模块全量人工审查 + 结构检测器实测

**给未来的审查者（包括未来的我）**：本文件是这次审查的**唯一权威快照**。不要凭记忆、也不要凭上一轮会话的转述复述结论——先跑 §0.2 的三条命令重新锚定，再按 §1 逐条复核（每条都带「复核命令」）。施工只做 §2 里状态为 READY 的任务；§3 的决策点必须先由用户拍板。

---

## §0 基线

### §0.1 冻结指纹（2026-09-15 21:48 本机）

| 文件 | sha1 | 行数 |
|---|---|---|
| `src/client/styles/base.css.ts` | `e6f2bac570a1fcb4e237dd151a8ae58cd21efe35` | 285 |
| `src/client/styles/layout.css.ts` | `c5e8a0140f0cec9494762ca288ddf2e5c8a5abb0` → 漂移后 `ef22d818bbab120ceb49ed02f42fd77218badf64` | 1117 → 1126 |
| `src/client/styles/compat.css.ts` | `110f753c746ba9ca30cf204b60308bdd947367e8` | 930 |
| `src/client/styles/misc.css.ts` | `4f5a5477a43040e5bb53af059a1be30ee4b500fc` | 277 |

四个文件在冻结时刻都 clean（= HEAD）。

> **注意（第 4 次漂移，冻结后 ≤15 分钟）**：`layout.css.ts` 已被另一个会话改成 `ef22d818…`（1126 行，+16/-7，未提交），内容是把消息正文的字号从冻结的 `15px !important` 改成宿主字号轴 `var(--dsw-font-markdown-base-font-size, var(--dsh-content-font-size, 14px))`（#52），`lib/` 同步重建中。**这是本文件唯一失效的一列行号**：`base` / `compat` / `misc` 三份 sha1 与冻结值完全一致，它们的行号仍然有效。已按内容逐条复核，**A2 / A4 / B1 / C1 / C2 / D1 / E2 七条全部存活**，只是偏移了 +8 ~ +11 行。

**行号是易耗品，内容是锚**：每条发现都带「复核命令」。行号对不上时用下表按内容重定位，不要凭偏移量硬加：

| 条目 | 按内容定位（`grep -n` on `layout.css.ts`） | 冻结时 | 第 4 次漂移后 |
|---|---|---|---|
| A2 | `order: 3` | L814–818 | **L824** |
| A4 | `out-specifies` | L187–196 | **L195** |
| B1a | `never matches it` | L743 | **L752** |
| B1b | `matches nothing` | L912 | **L921** |
| C1 | `max-width: 440px` / `max-width: 559px` | L913–916 / L929–932 | **L922 / L938** |
| C2 | `92vw` | L106 | L106（未变） |
| D1 | `below the host` | L84 | L84（未变） |
| E2 | `class\*="_text_"` | L301 / L317 | **L328** |

（`compat.css.ts` 的 A1/A3/C3/C4 与 `misc.css.ts` 的 D2/D3 行号不受影响；F1 在 `phone-chrome.ts`，按 §0.2 命令 3 检查。）

### §0.1b 奠基结果（隔壁会话收工、树静止之后）

| 项 | 结果 |
|---|---|
| 工作树 | `git status` **0 条**；最近 10 分钟无文件被改 → 静止 |
| 分支 / HEAD | `fix/50-52-49-verified`，头部 `e24687c docs(audits): add the 2026-09-15 CSS surface and structure audit`（本文件已被邻座提交入库） |
| 门禁 | `pnpm verify` ✅ · `pnpm test:core` **120/120** ✅ · `pnpm build` ✅ · `git diff --exit-code lib` **干净** ✅ |
| 指纹 | 与 §0.1 一致：只有 layout 是 `ef22d818…` / 1126 行（字体轴 #52），另三份与冻结值**逐字节相同** |
| **F1** | **已修**：`6111603 refactor(client): delete the dead host-generation probe`（源码 −43/+11，bundle 354267→352613 B），函数 docstring 留了墓碑注释 |
| **T0** | **已完成**：`scripts/css-structure-check.mjs` 入库（sha1 `b2fd5b9141914e9350ab8e79e72ad2a991b03f73`） |
| A–E 各条 | **全部存活**：A1 仍 16 fatal；A2/A4/B1/C1/C2/D1/E1/E2/C3/C4 的内容锚逐一命中（行号见上表） |
| 本文件登记 | 已写入 `AGENTS.md` 维护入口（并受 `tests/docs-consistency.test.ts` 的「引用必须存在」门约束） |

**F1 的再检查式必须改（否则假阳性）**：现在 `grep -rn 'data-mobile-nav-gen' src/ lib/` 会命中**墓碑注释**（3 处）。要锚在写入方/符号上：

```sh
grep -rnE "(set|remove)Attribute\('data-mobile-nav-gen'" src/ lib/ | wc -l   # 期望 0
grep -rn 'isNativeDrawerGeneration\|updateNativeDrawerGen' src/ lib/ | wc -l  # 期望 0
```

**教训（写进同类守卫）**：字符串式守卫会被「解释这条已删除」的注释打成假阳性——删死代码时留墓碑是对的，但守卫要锚在符号或写入方上。

**邻座新增的守卫面（别重复造）**：`src/client/core/css-rules.ts` + `tests/css-rules.test.ts` 是**源码级级联读取器**（回答「哪条 font-size 会落到这个元素上」，跑在 `test:core` 里）；它**刻意丢弃 at-rule 条件**，所以答不了嵌套深度/缩进这类问题——那正是本文件 T0 那个检测器的结构半边。两者互补，不合并。

**运行时就绪度（下一轮跑真页面前的硬前置）**：3080 在跑（无 cookie 401 → 有 cookie 200）；**served bundle 就是当前代码**（四个当前源码独有标记 `nothing ever read` / `dsw-font-markdown-base-font-size`×2 / `session-row-fiber`×3 / `data-mobile-nav-gen`×1 与本地 lib 1:1 命中），所以运行时审查看到的是被审的代码，不是旧 bundle。读它的正确姿势见 §0.1b 的 `rev` 修正（组合端点 `??dsh-web-mobile/client.js`；`rev` 与 sha1 无关，别用它判代）。零残留 headless chrom、`~/tmp/pw-dsh-tmp` 就位、chromium ELF 就位。

### §0.2 再审查：三条锚定命令

```sh
cd ~/dsh-mobile-nav
sha1sum src/client/styles/*.css.ts                       # 1. 比指纹，决定哪些行号还有效
node scripts/css-structure-check.mjs                     # 2. 结构门（本审查新增，源码见附录 A）
grep -rn 'data-mobile-nav-gen\|updateNativeDrawerGen' src/ lib/   # 3. F1 死代码回归检查（应 0 命中）
```

命令 2 的**基线是 16 fatal + 5 info**（全部 fatal 落在 `compat.css.ts` L743–817，即 A1）。T1 完成后应为 **0 fatal**，此后任何 fatal 都是新引入的结构缺陷。5 条 info 是复核清单，不是缺陷（C3、E2、dvh 兜底对）。

### §0.3 覆盖 / 不覆盖

- **覆盖**：四个 `.css.ts` 的语法结构、缩进与嵌套一致性、选择器特异度与顺序依赖、死声明/死规则、注释与实现是否一致、移动分支隔离（非移动环境是否被误伤）。
- **不覆盖**：像素级视觉正确性（那要靠真机/探针，见 §5）；第三方包内的样式；JS 行为正确性（只在其与 CSS 注释矛盾时作为证据引用）。
- 本审查**没有改动任何源码**，只新增本文件（与建议新增的检测器脚本）。

---

## §1 发现清单

严重度：**P1** = 会误导后续维护或已产生错误结论；**P2** = 冗余/脆弱，暂无行为错误；**P3** = 观感与整洁。

### A 类：结构

#### A1 · compat.css.ts L743–817 · P1 · 整块缩进失真 + 重复媒体查询

**现象**：`@media (max-width: 1023px) and (pointer: coarse)`（L6 开）仍然开着，但 L743–817 这 16 个块全部写在**第 0 列**，看起来像在媒体查询之外；其中 L763 又开了一层**同条件嵌套** `@media (max-width: 1023px) and (pointer: coarse)`（注释声称是「窄屏额外一条」，实际条件是 AND 合并的冗余嵌套）。

**证据**：检测器 16 条 fatal，范围 L743–817；L743/749/756/763/794 逐一目视核对为真（`sed -n '743p;749p;763p;794p' src/client/styles/compat.css.ts`）。

**风险（为什么是 P1 而不是 P3）**：缩进在 CSS 里是**唯一**的嵌套信号，这里它撒了谎。任何人（或任何模型）据此判断「这些规则不在移动分支里」，都会得出错误结论：以为它们会影响桌面，或者以为自己新写的规则需要再加一层媒体查询。L763 的嵌套副本更会让人以为「这里有个内层条件」，而它没有任何作用。

**修法**：删掉 L763 那一行重复的 `@media`（保留其花括号需要一并收掉），并把 L743–817 整块按实际深度缩进到 2 / 4 空格。**必须整块一起改**：只删 L763 而不重新缩进，会让块结构错配；只缩进不删 L763 则留下误导性的空壳。
**复核命令**：`node scripts/css-structure-check.mjs`（该块应全部消失，fatal 归零）。
**验收**：检测器 0 fatal；`pnpm test:core` 通过（`docs-consistency.test.ts` 会重新校验「无裸 `.hash_ {` 选择器」等不变量）。

#### A2 · layout.css.ts L814–818 · P2 · 死声明（`order` / `flex` 对绝对定位元素无效）

**现象**：`[data-mobile-nav="frame"] [data-phase] header [data-mobile-nav="files"] { order:3; flex:0 0 28px; width:28px }`——该元素在 L677–683 已被钉成 `position:absolute !important; right:8px; top:12px`。绝对定位的子元素**不是 flex item**，`order` 与 `flex` 对它完全无效。

**证据**：真引擎 A/B（Playwright 夹具，两种 order 取值 × 两种 position）：absolute 时 `order:-1` 与 `order:3` 命中测试都返回 x=1244；改成 static 后同一夹具给出 40 / 140。即 order 只在非绝对定位时生效。
**修法**：删掉 `order` 与 `flex` 两行，保留 `width`（仍需显式宽度）。若未来想让该按钮回到流式布局，需要连同 L677 的 position 覆盖一起撤销——不能只加回 order。
**复核命令**：`grep -n 'order:3' src/client/styles/layout.css.ts`（应 0 命中）。

#### A3 · compat.css.ts L402–409 · P2 · 构造上永不生效的规则

**现象**：L402 已给 `[class*="_header"]:not([class*="_headerActions"])` 下的**每个** `[class*="_actions"]` 设 `display:none !important`；L405 紧接着去样式化这些元素的子元素 `[class*="_action"]`。父元素已经彻底不渲染，子元素规则不可能有可见效果。
**证据**：两条选择器逐字对照（L402 是 L405 的真前缀链）。
**修法**：删 L405–409 整块（含注释）。删除**零行为变化**——这是全清单里最安全的一条。
**复核命令**：`grep -n '_actions"\] \[class\*="_action"\]' src/client/styles/compat.css.ts`（应 0 命中）。

#### A4 · layout.css.ts L187–196 · P2（决策 D-2）· 特异度平局被当成「压过」

**现象**：注释声称第一个选择器「simply out-specifies」宿主规则；实测两边都是 4 个属性选择器 = **(0,4,0)**，是平局，胜负由**样式表注入顺序**决定——正是同一段注释紧接着警告的那种依赖。
**证据**：`docs/audits/2026-09-13-0.1.5-region-audit.md:141` 记录了宿主那条规则的 (0,4,0)；本插件侧同数属性选择器。
**修法**：二选一，见 §3 D-2。不修也不能说它是 bug——平局在我们这边时结论正确，只是结论**没有它声称的那种保障**。
**复核命令**：`grep -n 'out-specifies' src/client/styles/layout.css.ts`。

### B 类：注释腐坏

#### B1 · layout.css.ts L743、L912 · P1 · 批量替换误伤散文

**现象**：两处注释现在读作「so `[class*="_root"]` never matches it. Use `[class*="_root"]`…」与「…carries a trailing space; `[class*="_root"]` matches nothing」——**语义完全颠倒**（原文讲的是后缀选择器 `[class$=` 失配，被改成了子串选择器）。
**证据**：`d586aa5`（`fix: match prefixed CSS-module hashes with substring selectors`）把 `[class$=` 批量替换为 `[class*=`,替换**扫到了注释**；全仓库 `src/` 现存 `[class$=` 命中数为 0，说明这次替换是全局的。
**修法**：只改回这两处散文里的记号（保持结论正确：后缀测试对整串生效，带尾随空格/多 token 的 class 会整体失配）。**不要**去动任何选择器本体。
**复核命令**：`grep -rn 'class\$\=' src/client/styles/`（修完后这两处注释里应出现 `[class$=]` 字样，选择器仍是 `[class*=]`）。

### C 类：冗余与失效

| ID | 位置 | 现象 | 修法 |
|---|---|---|---|
| C1 | layout.css.ts L913–916 vs L929–932 | 同一条 `…header [class*="_crumbs"] { padding-right: 8px }` 同时写在 `@media (max-width: 440px)` 与 `(max-width: 559px)` 里；440 ⊂ 559，窄的那份永不单独生效（两份的 `_count` 守卫不同是**有意**的，别一起删） | 删 440 块里的 `_crumbs` 那条，保留 `_count` 那条 |
| C2 | layout.css.ts L106 | `max-width: 92vw` 永不生效：同行 L105 已是 `width: min(88vw,280px) !important`，88vw 恒小于 92vw；它也无法「防」宿主的 important 宽度（important 对 important 靠特异度与顺序，不靠 max-width） | 删 L106（保留 L105 的 `min()` 作为唯一宽度来源） |
| C3 | compat.css.ts L769/L789（另 layout L592/L617、base L137/L196 同形） | 同一个 `> [class*="grow"]` 选择器被拆成相隔 15–20 行的两条规则 | 合并成一条；纯整洁，零行为变化（检测器把它列为 info） |
| C4 | compat.css.ts L110 | 注释「The fullscreen toggle has its own drawer-open rule at the end of its section.」——**该规则不存在**（全文没有 `preview-full-toggle` 与 `data-sidebar-collapsed` 的配对） | 删这句，或改写成事实：toggle 作为列的子孙被 L111–115 一并隐藏（同文件 L157–159 的注释写的是正确版本） |

### D 类：注释与实现漂移

#### D1 · layout.css.ts L82–88 · P1 · 注释仍在论证已被推翻的取值

**现象**：注释说「z-index:40 is below the host's 1100」，而实际规则是 `z-index: 1300 !important`（L115）；引用的 321px 等测量值也来自旧宽度（现为 `min(88vw,280px)`）。
**证据**：同文件 L179（AGENTS.md 亦同）记录了 40→1300 的历史与「全黑 + 点哪都关」的根因。
**修法**：把这 7 行注释改写成当前事实：抽屉列 1300 / 遮罩 1250 的层级契约，以及为什么 40 会致命（压到宿主 1100 之下 → 有 box 不绘制）。不必保留历史数值。
**复核命令**：`grep -n 'below the host' src/client/styles/layout.css.ts`（应 0 命中）。

#### D2 · misc.css.ts L204–207 · P2 · 「所有模态框都居中」言过其实

**现象**：L208–209 的实际覆盖是 `(sheet-shape ∧ ¬nav ∧ ¬ZuhsRW) ∪ (¬sheet-shape)`——**目录选择器一族被有意排除**（见 `layout.css.ts` L977–996 的专门规则）。
**修法**：把「All modal dialogs」改成实际覆盖范围，并指出目录选择器由哪条规则接管。
**复核命令**：`grep -n 'never edge-to-edge' src/client/styles/misc.css.ts`。

#### D3 · misc.css.ts L113–116、L125–129 · P2（决策 D-1）· 16px 规则没有 iOS 门控

**现象**：这两条被标题为「kill iOS Safari auto-zoom」的 16px 规则**不带** `html[data-mobile-nav-ios]` 门控；而同文件 L146–148 的注释明确写着「Android and desktop keep the compact 13px search boxes」，L168 起另有一套**带门控**的 16px 下限。
**后果**：iOS 上这两条与 L168–174 完全冗余；Android 上它们的唯一效果是把 13–14px 抬到 16px（与「Android 保持紧凑」的声明直接矛盾）。
**修法**：见 §3 D-1（要么加 iOS 门控，要么承认 Android 就要 16px 并改掉 L146–148 的说法）。
**复核命令**：`node scripts/cdp-zoom-probe.mjs`（21 断言；三场景含 Android 无 iOS 标记时应保持 13px 的那条断言）。

### E 类：有意为之，但脆

#### E1 · base.css.ts L98 vs L111 · P2 · 特异度倒挂使三条 `!important` 变成承重墙

**现象**：L98 `[data-mobile-nav="delete-confirm-actions"] > button` (0,1,1) **压过** L111 `[data-mobile-nav="delete-confirm-yes"]` (0,1,0)。因此 L111 里的三条声明必须带 `!important` 才画得出来。
**证据**：真引擎实测——去掉 `!important` 后计算值是 `rgb(1,1,1)/rgb(2,2,2)`，保留时是 `rgb(9,9,9)/rgb(8,8,8)`。
**修法**：不紧急，但要在 L111 处留一句注释说明「这里的 `!important` 是被 L98 的特异度逼出来的，任何新增的非 important 属性都会静默失效」。这是**防止下一个人加属性加了个死的**。
**复核命令**：`grep -n 'delete-confirm-yes' src/client/styles/base.css.ts`。

#### E2 · layout.css.ts L301、L317 · P3 · 全仓仅有的两处多行选择器

**现象**：`[data-phase]` 与 `[class*="_scroll"]…` 被折成三行、用 `[ class*="_text_" ]` 这种带空格的写法。这是四个模块里**唯一**的格式例外（检测器按「选择器首行缩进」判定为合规，故不报 fatal）。
**修法**：可选改成单行，与全仓风格一致；不改也无害。
**复核命令**：`node scripts/css-structure-check.mjs`（无输出即合规）。

### F 类：流程与仓库状态（本次审查最重要的两条）

#### F1 · phone-chrome.ts L118/L166/L170/L171/L186/L197 · P1 · 已被批准删除的死代码回来了，而三份文档都写着「源码零残留」

> **状态：已修（2026-09-15，`6111603`）**——邻座按本条删除并留墓碑注释；下面的现象描述保留为原始取证。**再检查式见 §0.1b**（不要用裸字符串，墓碑会假阳性）。

**现象（原）**：`isNativeDrawerGeneration()` / `updateNativeDrawerGen()` 仍在源码里，每次 `frame-marker` flush 在 `<html>` 写 `data-mobile-nav-gen="native-drawer"`——**全仓库没有任何读者**（CSS 四模块 0 命中、JS 0 命中，只有 3 处写/清）。而 `AGENTS.md` §Pitfalls、`docs/maintenance/pitfalls.md:131`、`docs/audits/2026-09-13-0.1.5-region-audit.md:233` 三处都写着「已于 2026-09-14 用户批准后整体删除（源码零残留）」。

**根因（可复现）**：`git log --all --oneline -S'isNativeDrawerGeneration' -- src/client/effects/phone-chrome.ts` **只返回一个提交 `6e80661`（加入的那次）**——**删除从未被提交**，它只存在于当时的working tree，随后在某次分支切换/还原中丢失。这与本次会话 21:44 记录的其它丢失同源（见 §4）。

**为什么必须记在这里**：这正是「文档说做过了、代码说没做」的活体案例，而它踩的还是本仓库已经总结过的教训（`pitfalls.md:131`：判死代码要 grep 读方，不能读写入方的自述注释）。下一位审计者若相信文档，会把「4 处写入 + 0 读者」这一现状**再次**误判成已清理。

**修法**：见 §3 D-3（推荐重新删除，并在同一次提交里重建 lib）。
**验收（两条都要）**：
```sh
grep -rn 'data-mobile-nav-gen\|updateNativeDrawerGen\|isNativeDrawerGeneration' src/ lib/ tests/ scripts/ | wc -l   # 期望 0
pnpm build && git diff --exit-code lib   # 期望无差异（lib 已随源码重建并提交）
```

#### F2 · 仓库状态 · P2 · 审查对象在审查过程中被三次改写

**时间线（本机同时刻，同一会话内实测）**：

| 时刻 | 分支 | `git status` 条目 | 4 个 CSS 文件 | AGENTS.md |
|---|---|---|---|---|
| 21:44 | `fix/issues-50-52-host-parity` | 21 | base/misc MODIFIED，layout/compat clean | MODIFIED（66353 B，超预算） |
| 21:48 | `fix/50-52-49-verified` @ `a7c4c97` | 8 | 四份 sha1 **与 21:44 完全一致** | = HEAD |
| 22:0x | `fix/50-52-49-verified`（未提交） | 10 | **layout 变成 `ef22d818…`（+16/-7）**，另三份不变；`lib/` 已被对方重建 | 未变 |

`a7c4c97`（`chore: baseline normalization — carry in-flight work…`）把在飞工作一并提交，理由是**已提交的 AGENTS.md 66353 B 超过 `tests/docs-consistency.test.ts` 的 65536 B 预算**，干净检出会直接挂在 `test:core`。该提交**没有碰** `layout.css.ts` / `compat.css.ts`——本次审查的 CSS 结论因此全部存活（行号已按新文件复核）。

**流程结论（写进下次审查的开工动作）**：审查开始前必须先 `sha1sum` 四个 CSS 文件并记录分支/HEAD；审查中途若文件变了，**只重定位变化的那几个条目**，不要重跑全量。本文件 §0.1 就是按这个规矩写的。

---

### G 类：本次**没有**系统审查的隐性 bug 类别（诚实登记，勿当成已审）

上面 A–F 是**静态可得**的那一类隐性缺陷：永远不生效的死代码、撒谎的注释、被当成压过的平局、特异度倒挂逼出的承重 `!important`。下面这一类**本次只做了线索级扫描，没有定性**，而它恰恰是本仓库历史上真正出过事的类别（hero 净空被同特异度 (0,3,0) 踩成 6px；header 排布冲突；`base→layout→compat→misc` 的拼接顺序让 misc 覆盖 compat）：

> **跨模块「同特异度 + 命中同一元素 + 靠样式表加载顺序定胜负」的声明。** 表现是：某条规则看着写对了，实际被后一块里一条**并不更强**的规则压掉；或者反过来，一条旧规则在特定状态下才被压掉，于是只有那个状态出问题。

**本次做到哪一步**：现补了一次静态扫描（脚本 `~/tmp/css-review/cross-module-conflict.mjs`，一次性工具，故意不落库）：
- (a) **完全相同的选择器文本**跨模块且同名属性取值不同 → **0 组**（这是个有用的阴性结论：冲突不是「同一选择器写两遍」这种显式形态）。
- (b) 不同选择器、**特异度相同**、同名属性取值不同 → **63 组候选**，但绝大多数是**假阳性**：`[data-mobile-nav="toggle"]`（base L7）与 `[data-mobile-nav="fab"]`（base L205）特异度都是 (0,1,0) 且都声明 `display`/`align-items`，可它们**永远不可能是同一个元素**。静态匹配无法回答「是否命中同一元素」，所以 (b) 只能当线索表，**不能当结论**。

**结论：这一类无法用静态分析定性，必须取运行时的元素级 matched rules。** 唯一可靠手段是 CDP 的 `CSS.getMatchedStylesForNode`（对每个命中元素返回 matchedCSSRules、各自特异度与来源样式表），把「被同特异度对手按顺序压掉的声明」逐条列出来。本仓库现有 15 个探针 + 主探针 32 断言 + CI 三门**都没有覆盖这个能力**。

**同一类别里另外三个未审项**（都需要运行时，本次完全没碰）：
1. **状态矩阵**：抽屉开/合 × files 面板开/合 × sheet 开 × `[role="menu"]` 开 × 流式中 × subagent running/idle 形态 × `html[data-mobile-nav-ios]` 有/无 × ≥1024px 宽触摸。本次只在「默认态」上推理。
2. **`:has()` 过匹配**：如 `header:has(> *)`、`body:has([data-mobile-nav="frame"]:not([data-sidebar-collapsed]))`——守卫是有的，但没验证它在别的状态（空 header、hero 态、多个 menu）下是否误命中。
3. **`env()` 兜底完整性**：只在 files 面板那条上核过；没做全量 `env(safe-area-inset-*)` 的 sweep（有无 fallback、是否与 `box-sizing` 成对）。

### H 类：本次未审的其它面

- 第三方包自带的样式表（aionui / market / genui / meme / stats / file-viewer 的 **上游** CSS 与我们规则的交互，只看了我们自己这四份）。
- `lib/` 生成物与源码的一致性（只用了 `git diff --exit-code lib` 这个门，没逐条比对 CSS 文本）。
- 动画/过渡的时序与 `prefers-reduced-motion` 分支的实际观感。

## §2 施工任务

### Global Constraints（每个任务都隐含遵守）

- **AGENTS.md 预算**：测试强制 ≤ **65536 B**；**但运行时注入截断更早**（实测 65501 B 时尾部整条不加载），安全线按 **≤64800 B** 走。2026-09-16 压缩后为 **64535 B**。加指针时若超，先把叙述性内容搬进 `docs/maintenance/pitfalls.md`。
- **AGENTS.md 只能引用存在的路径**，且必须匹配 `scripts/probes/*.mjs` / `scripts/cdp-*.mjs` / `docs/specs/*.md` / `docs/audits/*.md` / `docs/upstream/*.{md,json}` / `docs/maintenance/*.md`；引用数 ≥10。
- **`pitfalls.md` 需 ≥15 个 `## ` 小节；AGENTS.md 需 ≥15 个指向它的 `docs/maintenance/pitfalls.md\` §` 指针。**
- **每个 CSS 模块反引号恰好 2 个**（模板定界符）；**CSS 注释里写反引号会提前终止模板**（TS1005）。
- 三个 CSS 模块中**不得出现裸 `.hash_ {` 选择器行**；`wSkVaW_` 规则必须带 `[data-mobile-nav="frame"]`（同测试文件）。
- **`lib/` 必须随源码重建**：CI 有 `git diff --exit-code lib` 新鲜度门。改完源码不 rebuild = 任务未完成。
- 门禁顺序：`pnpm verify` → `pnpm test:core` → `pnpm build` → lib 新鲜度。
- **lib 新鲜度这条命令有陷阱（2026-09-16 实证，两个坏提交就是这样溜过去的）**：`git diff --exit-code lib` 比的是**工作区 ↔ index**，只要你之前 `git add lib` 过，它**恒绿**，无论源码有没有一起提交。CI 里 index==HEAD 所以有意义，本地不是。本地等价写法＝提交后**再 build 一次**，然后 `git diff --exit-code HEAD -- lib`（比 HEAD，不比 index）；源码与 `lib/` 必须进**同一个提交**。
- 动任何文件前先跑 §0.2 命令 1；指纹不符则该文件的行号作废。

---

### Task 0：把结构检测器落库 —— **已完成（2026-09-15）**

> 已落在 `scripts/css-structure-check.mjs`（sha1 `b2fd5b9141914e9350ab8e79e72ad2a991b03f73`），跑当前树输出 **16 fatal + 5 info**（＝A1 的债，T1 清零）。脚本头已注明与 `src/client/core/css-rules.ts` 的分工。**暂不接进 `test:core`**：接入即在 16 fatal 上变红，等 T1 之后再说。

**Files:** Create `scripts/css-structure-check.mjs`（源码见**附录 A**，本审查已实测）

- [ ] **Step 1**：把附录 A 的源码原样复制为 `scripts/css-structure-check.mjs`（该脚本在 `scripts/` 下会自动把仓库根解析为 `../`，无需环境变量）。
- [ ] **Step 2**：`sha1sum scripts/css-structure-check.mjs` → 期望 `b2fd5b9141914e9350ab8e79e72ad2a991b03f73`（与实测文件逐字节相同）。
- [ ] **Step 3**：`node scripts/css-structure-check.mjs` → 期望 **16 fatal + 5 info**，且 16 条 fatal 全部落在 `compat.css.ts` L743–817。
- [ ] **Step 4**：`node --test tests/docs-consistency.test.ts` → PASS（新脚本不进任何测试，只作人工门）。
- [ ] **Step 5**：提交 `chore: add css structure checker`。

> 可选（不阻塞）：把它挂进 `package.json` scripts（如 `"check:css": "node scripts/css-structure-check.mjs"`）。**不要**接进 `test:core`：当前基线是 16 fatal，接了立刻红。

---

### Task 1：A1 —— compat 块缩进归位 + 删除重复媒体查询

**Files:** Modify `src/client/styles/compat.css.ts:743-817`（并删除 `:763`）

- [ ] **Step 1**：先跑基线：`node scripts/css-structure-check.mjs`（记录 16 fatal 的确切行号）。
- [ ] **Step 2**：删除 `:763` 那一行 `@media (max-width: 1023px) and (pointer: coarse) {` **及其配对闭合花括号**（配对括号在块尾，务必数清楚；删完先跑 Step 4 看 fatal 数是否从 16 降到 15 左右再继续）。
- [ ] **Step 3**：把 L743–817 整块按真实嵌套深度缩进：直接位于移动媒体查询内的规则缩 2 空格，嵌套层内的缩 4 空格。**只改行首空白**，不动任何选择器和声明。
- [ ] **Step 4**：`node scripts/css-structure-check.mjs` → 期望 **0 fatal**（info 仍为 5）。
- [ ] **Step 5**：`git diff --stat src/client/styles/compat.css.ts` 人工核对：diff 应**只有空白变化 + 一行删除**，不得出现任何属性/选择器改动。
- [ ] **Step 6**：`pnpm verify && pnpm test:core && pnpm build && git diff --exit-code lib`（最后一条在提交前必然显示 lib 有差异——先 `git add lib` 再复跑）。
- [ ] **Step 7**：提交 `style(compat): restore block indentation and drop the duplicate media query`。

---

### Task 2：B1 —— 复原两处被批量替换误伤的注释

**Files:** Modify `src/client/styles/layout.css.ts:743`、`:912`（散文里的记号，**不是选择器**）

- [ ] **Step 1**：`sed -n '742,744p;911,913p' src/client/styles/layout.css.ts` 读现行文本（现在语义是反的）。
- [ ] **Step 2**：把两处散文改回后缀记号的正确说法：后缀测试对整个 class 属性串生效，因此带尾随空格或多 token 的值（如 `ZKlsPq_root `）会整体失配。
- [ ] **Step 3**：`grep -rn 'class\$\=' src/client/styles/` → 只应命中这两条注释；`grep -c 'class\*=' src/client/styles/layout.css.ts` 不变（选择器一个没动）。
- [ ] **Step 4**：`node --test tests/docs-consistency.test.ts` → PASS（反引号恰好 2 个；注释词不引入反引号）。
- [ ] **Step 5**：`pnpm build && git add src lib && git commit && pnpm build && git diff --exit-code HEAD -- lib`。
- [ ] **Step 6**：提交 `docs(css): restore the suffix-matching prose mangled by the hash migration`。

---

### Task 3：A2 + A3 —— 删死声明与死规则

**Files:** Modify `src/client/styles/layout.css.ts`（A2，用 `grep -n 'order: 3'` 定位；冻结时 L814–818）；Modify `src/client/styles/compat.css.ts:402-409`（A3）

- [ ] **Step 1（A2）**：定位 `order: 3` 所在的那条 `[data-mobile-nav="files"]` 规则，删掉 `order: 3;` 与 `flex: 0 0 28px;` 两行，保留 `width: 28px` 与选择器/花括号。
- [ ] **Step 2（A2 验证）**：`grep -n 'order:3' src/client/styles/layout.css.ts` → 0 命中。
- [ ] **Step 3（A3）**：删掉 L405–409 整块（死规则 + 其上方的说明注释）。
- [ ] **Step 4（A3 验证）**：`grep -n '_actions"\] \[class\*="_action"\]' src/client/styles/compat.css.ts` → 0 命中。
- [ ] **Step 5**：`node scripts/css-structure-check.mjs` → 仍 0 fatal（若 T1 未做则为 16，注意别把新问题算进基线）。
- [ ] **Step 6**：`node scripts/probes/header-files-pin-probe.mjs`（若本机有活跃 3080 实例；它守的正是那个被钉在右上角的按钮，11 断言）——A2 只删死声明，期望结果不变。
- [ ] **Step 7**：`pnpm verify && pnpm test:core && pnpm build && git add src lib && git commit && pnpm build && git diff --exit-code HEAD -- lib`。
- [ ] **Step 8**：提交 `refactor(css): drop declarations and a rule that can never apply`。

---

### Task 4：C1–C4 —— 冗余清理

**Files:** Modify `src/client/styles/layout.css.ts:106`、`:913-916`、`:592/617`；`src/client/styles/compat.css.ts:110`、`:769/789`；`src/client/styles/base.css.ts:137/196`

- [ ] **Step 1（C1）**：删 `@media (max-width: 440px)` 块内的 `…header [class*="_crumbs"] { padding-right: 8px }`（保留同块的 `_count` 规则，那是 ≤440 与 ≤559 的**有意差异**）。
- [ ] **Step 2（C2）**：删 L106 的 `max-width: 92vw`（`min(88vw,280px)` 恒更小）。
- [ ] **Step 3（C3）**：合并三处被拆分的同选择器规则（`grow` / `:first-child` / `header`）——**先 `node scripts/css-structure-check.mjs` 看 info 列表确认位置**，合并时保持声明顺序，因为同一条规则内后写的同属性才生效。
- [ ] **Step 4（C4）**：删掉「has its own drawer-open rule at the end of its section」这句失实注释，改成 toggle 作为列的子孙被同一块隐藏。
- [ ] **Step 5**：`node scripts/css-structure-check.mjs` → fatal 数不增加；info 从 5 降到 2（C3 三处消失，dvh 与 E2 保留）。
- [ ] **Step 6**：`pnpm verify && pnpm test:core && pnpm build && git add src lib && git commit && pnpm build && git diff --exit-code HEAD -- lib`。
- [ ] **Step 7**：提交 `refactor(css): remove redundant rules and a stale comment`。

---

### Task 5：D1 + D2 —— 注释订正

**Files:** Modify `src/client/styles/layout.css.ts:82-88`；`src/client/styles/misc.css.ts:204-207`

- [ ] **Step 1**：把 layout L82–88 改写成当前事实（列 1300 / 遮罩 1250 的层级契约；为什么 40 会致命——压过宿主 1100 后「有 box 却不绘制不命中」）。删掉 321px 等旧测量值。
- [ ] **Step 2**：`grep -n 'below the host' src/client/styles/layout.css.ts` → 0 命中。
- [ ] **Step 3**：把 misc L204 的「All modal dialogs」改成实际覆盖（sheet 形态 ∧ ¬nav ∧ ¬ZuhsRW，加上 ¬sheet 形态），并注明目录选择器由 `layout.css.ts` 的专条接管。
- [ ] **Step 4**：`pnpm verify && pnpm test:core && pnpm build && git add src lib && git commit && pnpm build && git diff --exit-code HEAD -- lib`。
- [ ] **Step 5**：提交 `docs(css): align comments with the shipped behaviour`。

---

### Task 6：F1 —— 重新删除 `data-mobile-nav-gen` 死代码（须先过 §3 D-3）

**Files:** Modify `src/client/effects/phone-chrome.ts:118-197`（两个函数 + 调用点 + dispose 清理）

- [ ] **Step 1**：`git log --all --oneline -S'isNativeDrawerGeneration' -- src/client/effects/phone-chrome.ts` 记录证据（应只有 `6e80661` 一个提交 = 删除从未提交）。
- [ ] **Step 2**：删除 `isNativeDrawerGeneration()`、`updateNativeDrawerGen()` 两个函数、`frame-marker` 任务里的调用、以及 dispose 分支里的 `removeAttribute`。
- [ ] **Step 3**：`grep -rn 'data-mobile-nav-gen\|NativeDrawerGen' src/ | wc -l` → **0**。
- [ ] **Step 4**：`pnpm verify && pnpm test:core`（`pnpm verify` 会抓出遗漏的导出引用）。
- [ ] **Step 5**：`pnpm build`，然后 `grep -c 'data-mobile-nav-gen' lib/client.js` → **0**（lib 里的 3 处旧命中随之消失）。
- [ ] **Step 6**：`git add src lib && git commit && pnpm build && git diff --exit-code HEAD -- lib`。
- [ ] **Step 7**：更正三处「已删除」陈述，使其与**这一次真的提交了**的事实一致（AGENTS.md §Pitfalls 那句、`docs/maintenance/pitfalls.md:131`、`docs/audits/2026-09-13-0.1.5-region-audit.md:233`），并追加一句溯源：上次删除未提交、在分支切换中丢失，本次以提交固化。
- [ ] **Step 8**：提交 `fix(client): actually remove the dead drawer-generation probe`。

---

### Task 7：收口

**Files:** Modify `AGENTS.md`（Maintenance 区一条指针）、`README.md`（若涉及计数）、`docs/maintenance/pitfalls.md`（若新增小节）

- [ ] **Step 1**：在 AGENTS.md 的 Maintenance/Testing 区加**一条**指针（≤527 B 余量）：指向本文件，说明「CSS 表面审查的发现与再审查协议在此」。
- [ ] **Step 2**：`node --test tests/docs-consistency.test.ts` → PASS（三条：引用路径存在、字节 ≤65536、pitfalls 小节/指针 ≥15）。
- [ ] **Step 3**：`stat -c%s AGENTS.md` → 必须 ≤65536（超了就把等长叙述搬进 `pitfalls.md` 再试）。
- [ ] **Step 4**：全门禁 `pnpm verify && pnpm test:core && pnpm build && git diff --exit-code lib`。
- [ ] **Step 5**：把本文件 §1 各条的状态列改为 DONE/SKIPPED 并补一行「本次执行人 / 日期 / HEAD」。
- [ ] **Step 6**：提交 `docs: register the css surface audit and close its tasks`。

---

### Task 8（可选 · 需你决定是否立项）：把「同特异度踩踏」这一类从「没审」变成「有门」

**为什么值得单独立项**：它是本仓库唯一反复出事的隐性类别，而现有 CI 与探针对它零覆盖；本次只能给到线索级。

**Files:** Create `scripts/probes/cascade-conflict-probe.mjs`（原生 CDP，复用 `scripts/cdp-probe.mjs` 的 `createCdpClient`）

- [ ] **Step 1（设备）**：起 390×844 触摸仿真页面（`Emulation.setTouchEmulationEnabled`），等到 `[data-mobile-nav="frame"]` 与 `[data-phase="active"]` 同时在场。
- [ ] **Step 2（取元素）**：枚举移动分支下所有可见元素（`elementFromPoint` 网格采样 + 关键 marker 清单并集，避免全树遍历开销）。
- [ ] **Step 3（取 matched rules）**：对每个元素调 `CSS.getMatchedStylesForNode`，收集 `matchedCSSRules`；对同一 (属性, 取值) 只看**胜出**的那条。
- [ ] **Step 4（判定）**：挑出**被压掉的声明中，特异度 ≥ 胜出者**的那些 → 即「不是输在弱，而是输在顺序」的踩踏候选。优先级：特异度相等（纯顺序决定，最脆）> 被压掉者更强（说明有 `!important` 参与）。
- [ ] **Step 5（过滤噪声）**：排除同一声明块内的自然后写覆盖（`vh`→`dvh` 兜底对）、排除 `:hover`/`:active`/`:focus` 伪类（非默认态）——前者在白名单里，后者留给 Step 6。
- [ ] **Step 6（状态矩阵）**：把 Step 1–5 在 8 个状态各跑一遍（抽屉开/合、files 面板开/合、menu 开、sheet 开、流式中、iOS 标记 on/off），只有**跨状态稳定**或**仅在某一状态出现**的分别归两类。
- [ ] **Step 7（产出）**：写一份「元素 → 被压掉的声明 → 压它的规则（模块:行 + 特异度）」清单，交给人工判定是**故意覆盖**还是**事故**；故意的在 `pitfalls.md` 记一条，事故的进 §1 变成新发现。
- [ ] **Step 8**：`DSH_PROBE_SESSION_ID=… node scripts/probes/cascade-conflict-probe.mjs` 跑通，把断言数写进 AGENTS.md 探针清单（注意 AGENTS.md 只有 527 B 余量，需同时搬走等量叙述）。

**风险**：Step 2 的采样策略决定覆盖率；全树遍历在大型会话上会超时，必须用 marker 清单 + 网格采样的并集（这是一个「采样而非穷举」的近似，`ponytail:` 上限：漏掉冷门元素；升级路径=对 marker 清单做全量、其余靠网格）。

## §3 待用户拍板

### D-1（原 D3）· Android 上这两条 16px 规则留不留？

`misc.css.ts:113-116` 与 `:125-129` 把 `[data-question-key] [class*="_customInput"]` 与 `[class*="dsfv-search-input"]` 抬到 16px，但**不带 iOS 门控**，与同文件 L146–148 的「Android 与桌面保持紧凑 13px」相矛盾。

- **选项 A（推荐）**：加 `html[data-mobile-nav-ios]` 前缀，与 L168–174 的既有体系合一。iOS 行为不变（那边本来也被 L168 覆盖），Android 回到 13px，声明与实现一致。
- **选项 B**：承认 Android 就是要 16px，改掉 L146–148 的说法（并把这两条从「iOS 反缩放」标题下移出来）。
- **选项 C**：不动，只加注释说明这是有意的例外——**不推荐**：这正是下一轮审查会再次报同一条的原因。

**影响面**：选项 A 会让 Android 上这两个输入框从 16px 回落到紧凑的 13px（iOS 不变——那边本来就被 L168 起的门控规则覆盖，故这两条在 iOS 上确实冗余）；选项 B 只改注释、不动像素。第三方案不是「等价改动」：它是把矛盾留在代码里。

### D-2（原 A4）· `layout.css.ts:187` 的特异度平局怎么办？

- **选项 A**：给插件那条再加一个匹配器（如 `:has(> …)`）把特异度提到 (0,5,0)，让「压过宿主」变成结构性事实。
- **选项 B**：接受平局，把注释改成「当前依赖注入顺序（插件样式表后注入），宿主若改注入顺序会翻转」。
- **推荐 B**：A 会引入一次未经验证的特异度加码，而这条规则目前工作正常；B 只需诚实记录风险。

### D-3（F1）· 死代码是删掉还是把文档改口？

- **选项 A（推荐）**：重新删除（2026-09-14 用户已批准过一次，删除理由仍成立：3 处写、0 处读，每帧 flush 白跑一次 `getComputedStyle`），并在同一次提交里重建 lib —— 即 Task 6。
- **选项 B**：保留代码，把三处「已删除」改口为「仍存在且无读者」。**不推荐**：留着每帧的无效计算，且下次还会有人上当。

---

## §4 过程记录：这次审查的仓库为何一直在动

1. **21:44**：审查进行中，`layout.css.ts` 从 1130 行变成 1117 行。丢失的未提交内容：`layout.css.ts` 的字体轴改动、`phone-chrome.ts`、`src/index.ts`，以及**被删除的未跟踪文件** `src/client/effects/session-row-fiber.ts`、`tests/session-row-fiber.test.ts`、`tests/host-parity.test.ts`。`git stash list` 为空，`git reflog` 只有一次分支切换。
2. **21:48**：分支变为 `fix/50-52-49-verified`，新提交 `a7c4c97` 把在飞工作一并提交（理由：已提交的 AGENTS.md 超 65536 B 预算会让干净检出挂在 `test:core`）。**四个 CSS 文件 sha1 未变**，故本次审查的 CSS 结论与行号全部有效。
3. **同会话内 AGENTS.md 被替换 ≥2 次**（内容互斥：一处说 `effects/` 的 `../` import 禁用，另一处说该禁令已证伪；测试/文档计数也在 13/14、6/7 之间摆动）。**结论：不要把 AGENTS.md 当作比代码更新的真相源**，冲突时以源码 + 探针为准，并把冲突登记到本文件。
4. **F1 是同一模式的第三次**：文档声称已完成的改动，实际没有落到提交里。

**给下一次审查的开工动作（三条，缺一不可）**：
1. `sha1sum src/client/styles/*.css.ts` + `git rev-parse --abbrev-ref HEAD` 记下基线；
2. `node scripts/css-structure-check.mjs` 看结构门是否仍为 0 fatal；
3. 重跑 §0.2 命令 3，确认 F1 没有回归。

---

## §5 未验证 / 不覆盖（诚实清单）

- **像素级视觉结论一律未验证**：本次没有起真机/探针。A1、A2、A3、C1–C4 的「零行为变化」是**基于 CSS 语义的推理 + 引擎 A/B（仅 A2、E1）**，不是端到端实测。涉及删除的条目（A3、C1、C2、C4）建议在合并后跑一次 `pnpm smoke:cdp`（主探针 32 断言，3 项预存失败已写成机读基线，看 SUMMARY 的 `new` 字段）。
- **A4 的特异度结论**来自 `docs/audits/2026-09-13-0.1.5-region-audit.md` 记录的宿主值 + 插件侧计数，未在活页面上用 `document.styleSheets` 递归核验。
- **D3 在真机 iOS 上的实际效果未测**（本地 headless 的 `detectIosWebKit` 恒 false，`cdp-zoom-probe.mjs` 只覆盖到标记与字号的可计算层）。
- **未审查**：`lib/` 生成物、`scripts/` 下探针的 CSS 断言、第三方包内的样式表。
- **最重要的一条**：本次**没有**系统审查「跨模块同特异度踩踏」这一类隐性 bug（见 §1 G 类）。静态扫描只能给线索（63 组候选里绝大多数是假阳性），定性必须靠运行时逐元素 `CSS.getMatchedStylesForNode`——那是 Task 8。**不要把「本次审查通过」读成「这一类也干净」。**
- 检测器本身**不覆盖**三类问题：语义冗余（C1/C2 那种「条件被包含」）、注释与实现是否一致（C4/D1/D2）、特异度平局（A4）——这三类必须人工判断，检测器只负责结构。

---

## §6 追加审查：2026-09-16 六向并行只读审查

起因：§1 的 A–F 是**静态可得**的那一类，§G 当时诚实登记为「未审」。2026-09-16 用六个互不重叠的只读 agent 补审，每个带同一份上下文包（`docs/audits/2026-09-16-parallel-review/00-context-brief.md`），硬约束＝**不改仓库、不跑 build、不起 chromium、不派子代理**，报告先写 `~/tmp` 再落库。落库报告见同目录。

| 报告 | 方向 |
|---|---|
| `B-effects.md` | `src/client/` 运行时 JS/DOM：marker 写读差集、disposer/observer/timer 配对、pointerup/click 时序、异常吞没 |
| `D-coverage-gaps.md` | 测试与探针的覆盖盲区：「改了会静默坏」清单 + 「断言断在 bug 本身」实证 |

（文档-实现漂移、宿主契约、生成物一致性与静态 CSS 残余四路由另派，报告落同一目录。）

### §6.1 新发现与处置

| 编号 | 发现 | 处置 |
|---|---|---|
| J1 | `overlay-backdrop-fab.ts`：`fadeHook` 只在**工厂体**里赋值一次，而 `core.deactivate()` 每次 MOBILE_QUERY 翻转都对每个 task 跑 `dispose()`（`reconciler-core.ts:146-158`），重新激活只跑 `ensure()`（`:139-143`），而 `registerReconcileTasks` 只被 `index.tsx:169` 调一次 → **第一次跨 1023px 之后遮罩渐隐永久失效**（收抽屉时遮罩直接消失）。全仓无测试/探针覆盖 `fadeOverlayOut` | **已修**（`4e6a45e`）：改为在 `ensure()` 里重新武装，并在注释里写明为什么不能在工厂体 |
| J2 | `base.css.ts:70` 的 `[data-mobile-nav="delete-confirm"]` **没有任何写方**（bundle 内该字面量计数 = 1，即选择器本身）→ 删除确认卡的红色描边/淡红底**从未生效过**（从 fork 摘进来就是死的） | **待拍板**：删掉该规则，或给写入方补上这个包裹属性（视觉决策，同 §3 体例） |
| J3 | reconciler 的 `MutationObserver` 未开 `characterData`，与 AGENTS.md「stats-line 因 TPS 是 characterData 文本变更而保持 `scopes:['*']`」相矛盾 | **未复现**：流式期大概率有别的 mutation 陪伴而掩盖。报告里写了构造验证法；**不改代码**（改了没有可证收益） |
| J4 | `gesture-guard` 的 `consumed` Map 对 DOM 节点持强引用、只在节点再次进入某次 click 祖先链时才删过期项 → 长会话单调增长并保留已卸载子树 | 低危（无功能错误）。可换 `WeakMap`；**未做** |
| J5 | `settings-toolbar-reparent.ts:12` 用**裸后代** `[class*="_header"]` 找锚点——正是仓库禁止的那条子串（CSS 侧已锚定到 `> [class*="_nav"] > …`）。当前安全只靠**文档顺序**（工具栏头在卡头之前） | 线索：活页面一条 `compareDocumentPosition` 即可判定；`plugin-card-header-bleed` 探针抓不到这个退化 |
| J6 | `stats-line.ts` 的 TPS 归还循环**以 marker 为索引**，marker 被自身 stale 分支摘掉后（慢路径又没重新标记）归还整体跳过 | 线索：需构造时序。最坏＝桌面态少一行 TPS |
| J7 | C3 的那三处「同选择器拆成两条规则」**未合并**：计划称「纯整洁、零行为变化」，但合并只有在证明两条之间的规则不会插队后才成立（同选择器拆分正是靠中间规则插队才成为经典陷阱） | **留作待办**，不当作已完成。检测器仍把它们列为 3 条 info（5 info 而非计划预期的 2） |

### §6.2 覆盖面：D 报告的结论

**最高危的一条**：`MOBILE_QUERY` 的 `(pointer: coarse)` 臂与 `misc.css.ts` 隐藏块的 `(pointer: fine), (pointer: none)` 臂**没有任何场景覆盖**——全部 CDP「桌面」场景都是 ≥1024px，宽度臂自己就能全隐藏，所以**删掉任一侧指针臂，全套门仍然绿**。根因是 `scripts/cdp-probe.mjs:159` 的 `setViewport(w,h,mobile)` 把 mobile 同时喂给 deviceMetrics 与 touchEmulation，**结构上无法表达「窄视口 + 鼠标」**——这正是 2026-08-30 已经泄漏过一次的 PC 泄漏形态。可跑判据：`D-pointer-guard-gap.mjs`（P1 绿＝守卫本身是精确补集；P2/P3 红＝scenes=33 而 narrow-mouse=0）。

其余缺口（aionui 整条集成零门、`subagent-chip-touch.ts` 零门、预览全屏按钮零门、`data-mobile-nav="stats"` 标记与 TPS 折叠零门、theme-color meta 零门、`dismiss-shadow` 零门、git-chip 被 `EXPECTED_FAILURES` 基线豁免、backdrop 渐隐零门、隐藏块清单无机械门、检测器未接进 `test:core`、debug 徽章与 `/diag` beacon 零门）逐条见 `D-coverage-gaps.md`。

### §6.3 对 §5「诚实清单」的修订

- G 类（同特异度踩踏）**仍未定性**；T8 的运行时探针是本轮才立项的。在它跑出结论之前，A–F 依然是「静态可得」的全集，**不是**「隐性 bug」的全集。
- 新增一条基础教训：**本地那条 `git add lib && git diff --exit-code lib` 是假门**——它比的是 index ↔ 工作区，`git add` 之后恒绿，源码没提交也能过。2026-09-15 的两个提交就是这样只装了 `lib/`（源码留在工作区，等价于 HEAD 在干净检出下过不了自己的 CI），已由 `232cc26` 补上源码。正确写法见 §2 Global Constraints。

---

## 附录 A：`scripts/css-structure-check.mjs`（已实测，sha1 `b2fd5b9141914e9350ab8e79e72ad2a991b03f73`）

设计要点：单趟解析模板字面量→记录每个块的嵌套深度与选择器首行行号（**多行选择器按首行判定**，这是 layout 那两处合规写法的前提）；行号已按模板起始行做了偏移，输出**就是 `.css.ts` 的真实行号**；fatal 决定退出码，info 只提示。刻意不做的事：不判定语义冗余、不比对注释——那三类留给人工与探针。

```js
// Structural checks for the four concatenated CSS modules.
//
// The repo has no linter and the CSS lives in TypeScript template literals, so
// these defect classes survive every existing gate (verify / test:core /
// docs-consistency): indentation that lies about nesting, declarations that can
// never apply, and blocks that escaped the mobile media query.
// node:builtin-only.  Usage: node scripts/css-structure-check.mjs
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = process.env.CSS_STRUCTURE_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..')
const MODULES = ['base', 'layout', 'compat', 'misc']

// Top-level at-rules that are legitimate in a module. Anything else must sit
// inside the mobile query, or it applies to desktop too.
const TOP_LEVEL_ALLOWED = [
  '@media (max-width: 1023px) and (pointer: coarse)',
  '@media (min-width: 1024px) and (pointer: coarse)',
  '@media (min-width: 1024px), (pointer: fine), (pointer: none)',
  '@media (pointer: fine), (pointer: none)',
  '@media (min-width: 768px) and (max-width: 1023px) and (pointer: coarse)',
  '@media (prefers-reduced-motion: reduce)',
]

const problems = []
const fatal = []
const info = []
const note = (file, line, msg) => fatal.push(file + ':' + line + '  ' + msg)
const soft = (file, line, msg) => info.push(file + ':' + line + '  ' + msg)

function load(name) {
  const file = name + '.css.ts'
  const source = fs.readFileSync(join(root, 'src/client/styles', file), 'utf8')
  const match = source.match(/=\s*`([\s\S]*)`\s*;?\s*$/)
  if (!match) throw new Error(file + ': no CSS template literal found')
  const css = match[1]
  // Lines reported must be real file lines: the template body starts after the
  // backtick on some earlier line, so shift every report by that many lines.
  const lineOffset = source.slice(0, match.index).split('\n').length - 1
  return { file, css, lineOffset, masked: css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')) }
}

// One pass: every block gets depth + indentation; every style rule also gets
// its raw body and the enclosing at-rule scopes.
function parse(file, css, masked, lineOffset) {
  const lines = css.split('\n')
  const blocks = []
  const rules = []
  const stack = []
  let line = 1
  let buf = ''
  let preludeLine = null
  const newlinesBefore = (from, to) => {
    let n = 0
    for (let k = from; k < to; k++) if (masked[k] === '\n') n++
    return n
  }
  for (let i = 0; i < masked.length; i++) {
    const c = masked[i]
    if (c === '\n') { line++; buf += ' '; continue }
    if (c === '{') {
      const prelude = buf.trim()
      buf = ''
      const frame = {
        prelude, line: preludeLine ?? line, start: i + 1,
        depth: stack.length,
        scope: stack.filter((f) => f.prelude.startsWith('@')).map((f) => f.prelude),
      }
      stack.push(frame)
      blocks.push(frame)
      preludeLine = null
      continue
    }
    if (c === '}') {
      const frame = stack.pop()
      if (frame && !frame.prelude.startsWith('@') && frame.prelude) {
        frame.body = css.slice(frame.start, i)
        frame.bodyStart = frame.start
        rules.push(frame)
      }
      buf = ''
      preludeLine = null
      continue
    }
    if (!/\s/.test(c) && preludeLine === null) preludeLine = line
    buf += c
  }
  if (stack.length) note(file, lines.length + lineOffset, 'brace balance broken at EOF')
  return { lines, blocks, rules, newlinesBefore }
}

for (const name of MODULES) {
  const { file, css, masked, lineOffset } = load(name)
  const { lines, blocks, rules, newlinesBefore } = parse(file, css, masked, lineOffset)
  const fail = (l, m) => note(file, l + lineOffset, m)
  const hint = (l, m) => soft(file, l + lineOffset, m)

  // 1. indentation must match real nesting depth
  for (const b of blocks) {
    if (b.depth === 0) continue
    const expected = b.depth * 2
    const actual = (lines[b.line - 1]?.match(/^ */) ?? [''])[0].length
    if (actual !== expected) {
      fail(b.line, 'indent ' + actual + ', nesting expects ' + expected + ': ' + b.prelude.slice(0, 60))
    }
  }

  // 2. top-level blocks that would apply outside the mobile branch
  for (const b of blocks) {
    if (b.depth !== 0 || !b.prelude.startsWith('@')) continue
    if (b.prelude.startsWith('@keyframes')) continue
    if (TOP_LEVEL_ALLOWED.includes(b.prelude)) continue
    fail(b.line, 'top-level at-rule outside the allowed set: ' + b.prelude)
  }

  // 3. the same property twice in one rule (the first can never apply)
  for (const r of rules) {
    const seen = new Map()
    let offset = 0
    for (const chunk of r.body.split(';')) {
      const decl = chunk.split('\n').map((s) => s.trim()).filter(Boolean).join(' ')
      const at = r.line + newlinesBefore(r.bodyStart, r.bodyStart + offset)
      offset += chunk.length + 1
      if (!decl) continue
      const idx = decl.indexOf(':')
      if (idx < 0) continue
      const prop = decl.slice(0, idx).trim()
      if (seen.has(prop)) {
        // A vh/px fallback followed by a dvh/px line is deliberate progressive
        // enhancement, not a mistake — report it as info so a reviewer can see it.
        const fallback = seen.get(prop)
        if (/dvh|dvw/.test(decl) && !/dvh|dvw/.test(fallback)) {
          hint(at, 'progressive-enhancement fallback pair for "' + prop + '"')
        } else {
          fail(at, 'duplicate property "' + prop + '" in one rule (first value: ' + fallback + '): ' + r.prelude.slice(0, 50))
        }
      }
      seen.set(prop, decl.slice(idx + 1).trim())
    }
  }

  // 4. the same selector declared twice in one scope
  const seenSelector = new Map()
  for (const r of rules) {
    const key = r.scope.join(' && ') + ' ||| ' + r.prelude
    if (seenSelector.has(key)) {
      hint(r.line, 'selector split across rules in one scope (first at ' + seenSelector.get(key) + '): ' + r.prelude.slice(0, 60))
    } else seenSelector.set(key, r.line)
  }
}

console.log('css-structure-check: ' + MODULES.length + ' modules, ' + fatal.length + ' fatal, ' + info.length + ' info')
for (const p of info) console.log('  info ' + p)
for (const p of fatal) console.log('  FAIL ' + p)
process.exit(fatal.length ? 1 : 0)
```

## 附录 B：一条命令复现本次全部证据

```sh
cd ~/dsh-mobile-nav
sha1sum src/client/styles/*.css.ts                        # §0.1 指纹
node scripts/css-structure-check.mjs                      # 0 fatal + 5 info（A1 已清；info = C3 三处 + dvh 兜底 + E2）
grep -rn 'class\$\=' src/client/styles/                   # B1（修完后仅注释命中）
grep -n 'order:3' src/client/styles/layout.css.ts         # A2（应 0）
grep -n '_actions"\] \[class\*="_action"\]' src/client/styles/compat.css.ts   # A3（应 0）
grep -n 'below the host' src/client/styles/layout.css.ts  # D1（应 0）
grep -n 'never edge-to-edge' src/client/styles/misc.css.ts # D2
grep -rn 'data-mobile-nav-gen\|NativeDrawerGen' src/ lib/ | wc -l  # F1（修完应为 0）
git log --all --oneline -S'isNativeDrawerGeneration' -- src/client/effects/phone-chrome.ts  # F1 溯源
```

---

**状态表（执行时逐条改这里，不要新开文件）**

| 条目 | 任务 | 状态 | 备注 |
|---|---|---|---|
| A1 | T1 | **DONE**（`26ca8e9`） | `git diff -w` 只剩「重复 media + 配对 `}`」两行删除；检测器 16 → **0 fatal** |
| B1 | T2 | **DONE**（`acc26ec`） | 两行散文，纯 `$`↔`*`；选择器未动 |
| A2 / A3 | T3 | **DONE**（`e2fa5a1`） | 复核命令 0 命中；A3 是零行为变化的那条 |
| C1–C4 | T4 | **DONE 除 C3**（`e2fa5a1`） | C1/C2/C4 已做；**C3 未做**——「合并拆分规则＝零行为变化」未被证明，合并前需查两条之间的规则，见 §6.1 J7 |
| D1 / D2 | T5 | **DONE**（`e2fa5a1`） | 注释按当前事实重写（1300/1250 契约、模态覆盖实际范围） |
| F1 | T6 | **DONE**（`6111603`） | 再检查式改用写入方锚，见 §0.1b |
| A4 | D-2 | 待拍板 | |
| D3 | D-1 | 待拍板 | |
| E1 / E2 | — | 建议加注释 / 可不动 | |
| F2 | — | 流程约定已写进 §0.2 |
| G（同特异度踩踏） | T8 | **探针立项中** | `scripts/probes/cascade-conflict-probe.mjs`（原生 CDP，8 状态矩阵）；静态仍是 (a)=0 / (b)=63 候选 |
| G（状态矩阵/:has 过匹配/env 兜底） | T8 | **未审** | 同上 |
| H（第三方上游 CSS / lib 一致性 / 动效时序） | — | **未审** | | |
