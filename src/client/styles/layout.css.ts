// layout — split from src/client/mobile.css.ts (2026-08-16), order preserved.
// Self-contained: the mobile media query opens and closes in this file.

export const LAYOUT_CSS = `/* ---------- mobile-only layout (narrow viewport AND touch-primary pointer) ---------- */

@media (max-width: 1023px) and (pointer: coarse) {
  /* --- Phone chrome ---
     The system status bar stays visible (no fullscreen). Three adjustments
     make it behave:
     - touch-action: pan-y pinch-zoom kills double-tap-to-zoom (and the 300ms
       tap delay) while keeping vertical pan. Omitting pan-x (i.e. not using
       the manipulation alias) forbids HORIZONTAL pan on the root: a
       left-edge horizontal drag would otherwise be claimed by the browser as
       a pan (firing pointercancel) before the sidebar swipe layer can
       classify it. touch-action does not inherit and the behavior
       intersection stops at the first scroll container, so only touches
       landing directly on the root background are affected — inner
       horizontal scrolling of content containers is untouched. pinch-zoom is
       listed on purpose (#45): a bare pan-y also drops pinch, and then a
       zoom the browser applied by itself — iOS enlarges the viewport when a
       field under 16px takes focus — can no longer be undone by the user,
       so the app stays magnified until it is reopened or rotated. Two-finger
       zoom is also the WCAG 1.4.4 escape hatch and costs the gesture layer
       nothing: pinch is not a horizontal pan.
     - overscroll-behavior-x: none suppresses the browser's edge history
       navigation on the root scroller — Android Chrome claims a horizontal
       stroke that STARTS within its edge band (EDGE_WIDTH_DP=48dp,
       NavigationHandler.java) and navigates BACK, the exact gesture that
       opens the drawer ("页面直接返回上一页", 2026-08-29 user report). Only
       html/body count for this (Chromium issue 41483088: inner containers
       are ignored by the navigation path). iOS Safari's edge back-swipe has
       no CSS opt-out (WebKit bug 240183) — there the widened gesture start
       zone (START_ZONE_RATIO 0.45 of the viewport width, ~176px at 390px,
       past every browser's edge-claim strip) is the mitigation.
     - With the client's viewport-fit=cover, env(safe-area-inset-top) is the
       status bar / notch height; the rules below push the app content below
       it so the status bar never covers anything. Off notched phones (or in
       a normal browser tab where the layout viewport already sits below the
       status bar) the inset is 0 and nothing shifts. */
  html,
  body {
    touch-action: pan-y pinch-zoom !important;
    overscroll-behavior-x: none !important;
  }

  /* AppFrame: the drawer takes the sidebar column out of grid flow, so the
     remaining in-flow items (center, details) land in tracks 1..2: give the
     center every pixel and keep the details track at zero. The top padding
     clears the status bar / notch for every in-flow surface (session header,
     messages, composer); the absolutely-positioned drawer is unaffected (its
     containing block is the frame's padding box, i.e. still the frame top).
     box-sizing MUST be border-box: the official frame is height:100% of a
     100%-height body, and it is content-box by default, so the safe-area
     padding is ADDED on top of the full viewport height. The frame then grows
     to 100% + inset, the document itself becomes scrollable by exactly the
     inset, and the sticky composer seat (bottom:0 of the scroll body) lands
     below the visual viewport. Symptoms on a notched phone: the whole UI can
     be swiped up, the composer lifts off the bottom leaving a blank strip,
     and the newest message sits under the composer because the host's
     at-bottom follow scrolls its own scroll body, not the document. With
     border-box the padding is taken out of the 100% height instead, so the
     frame is exactly one viewport tall and the document never scrolls.

     The leading html element selector is load-bearing, not decoration: the
     third-party @linxin666/dsh-web-all sheet ships an equal-specificity
     !important grid-template-columns for this same element under
     (max-width: 768px), so without the extra element the winner is decided by
     which sheet happens to be injected later. Measured before and after with
     scripts/probes/cascade-conflict-probe.mjs: no computed value moves, the
     rule only stops depending on sheet order (audit D-5 option A). */
  html [data-mobile-nav="frame"] {
    box-sizing: border-box !important;
    position: relative !important;
    grid-template-columns: minmax(0, 1fr) 0 0 !important;
    padding-top: env(safe-area-inset-top, 0px) !important;
  }

  /* The sidebar column (first grid child) becomes a left drawer. The drawer
     hugs the sidebar content exactly (the wide sidebar carries an inline
     width, ~280px): a fixed 92vw box would leave a white strip where the
     container background shows beside the content.
     Closed state: translateX(-110%) — more than -100% of the max-content
     width — guarantees the whole drawer (and its shadow, had it one) leaves
     the viewport. A mere -100% leaves a sliver on screen; -105% (as used
     before) left 14px of the drawer plus a long 32px-blur shadow gradient
     visible along the left edge of the main UI. No box-shadow at all: the
     dimmed backdrop already separates drawer from content. */
  /* These legacy column rules stay armed on every host generation: the phone
     owner prefers this drawer over the official overlay one (2026-09-13). The
     host's own drawer ships NO full-screen backdrop, so the conversation beside
     it stays hit-testable - the rejection reason.
     Layering contract: this column is 1300 and the backdrop 1250 (base.css),
     both deliberately above the host's native sidebarCol at 1100. The earlier
     value of 40 sat BELOW that 1100: because this same rule also forces
     position/inset/width on the element, the column kept a correct-looking box
     while neither painting nor hit-testing, which is the "all black, click
     anywhere closes" root cause. The backdrop we append carries the dimming. */
  [data-mobile-nav="frame"] > :first-child {
    position: absolute !important;
    inset: 0 auto 0 0 !important;
    /* !important is load-bearing: the host ships
       [data-dsh-frame] [data-pane="sidebar"] { width: min(88vw, 320px) !important }
       under (max-width: 768px), which at 390px resolves to a flat 320px and
       BEATS a plain declaration here - measured: our max-content never applied
       and the column stayed 320px.
       280 is the drawer's hard floor, measured by sweeping the column width from
       304 down to 264: the inner surface is a FIXED 280px box and never
       reflows, so every pixel below 280 is simply clipped off its right edge
       (the list stays 270px at every width and its right edge sits at 278, so
       270 and below cut into the list itself). At exactly 280 the panel is fully
       intact - only the 12px of its right-hand padding is given up - which is
       what the owner asked for over the previous 304. Going narrower is a
       one-line change, but it starts eating content. */
    width: min(88vw, 280px) !important;
    /* 1300 is a contract with base.css: the host pins its native sidebarCol at
       z-index:1100 and paints its mid layers up to that band, so the drawer must
       sit above the host stack AND above our own backdrop at 1250 (which dims
       the content area). At 40 the backdrop covered the drawer itself, so
       opening it showed a full-screen dim with no drawer (measured 2026-09-13
       at 390px: backdrop [0,0,390,844] z1250 over column [0,0,320,844] z40, and
       elementFromPoint(40,300) returned the backdrop). Keep in sync with the
       backdrop z in base.css. */
    z-index: 1300 !important;
    transform: translateX(-110%);
    transition: transform .28s var(--ds-ease-in-out, ease-in-out);
    /* Keep the drawer's own content below the status bar / notch: the drawer
       spans the full frame height (its absolute containing block is the
       frame's padding box, so the frame's own safe-area padding does NOT
       reach it). The drawer background paints the status-bar strip, which
       the client's theme-color meta matches, so the strip reads seamless. */
    padding-top: env(safe-area-inset-top, 0px) !important;
    /* Kill the official sidebarCol right border: with the backdrop the edge
       reads cleanly, and the settings dialog (width:100% of this box) stays
       pixel-flush with the drawer. */
    border-right: none !important;

    /* The drawer's inner surface is 280px wide while the column is 88vw/320px, so
     the remaining 40px showed our own column background as a vertical strip
     along the right edge (measured: content right edge 280, column 320; the
     owner reported a white bar). The inner surface owns that band instead, so
     the strip is filled by the drawer's real surface colour. */
    /* The 40px band is a STACKING result, not a colour one: the drawer's inner
     surface is only 280px wide (host markup), while our column is 320px and
     carries z-index 1300 - so the column's own background paints OVER the
     surface's right 40px. Pixel-verified from a screenshot with the drawer open:
     x=10..270 rgb(249,250,251) (the surface) against x=285..315 rgb(255,255,255)
     (our white column). Repainting the column with the surface's own value makes
     the seam invisible whatever the theme does; the surface underneath keeps its
     own colour for the 280px it does cover. */
    background: var(--dsw-alias-bg-surface, #f9fafb);
    /* Drawer swipe gestures (edge swipe-in / content swipe-out, see
     docs/specs/2026-08-27-sidebar-swipe-gestures.md).
     One rule is load-bearing for the gesture layer: dropping pan-x on the
     drawer lets horizontal pointermove events reach the gesture code —
     WITHOUT it the browser treats a horizontal stroke as a pan, fires
     pointercancel and the gesture never classifies (vertical panning stays
     intact). Start-hit is decided purely by geometry on the document
     capture listener (START_ZONE_RATIO = 0.45 of the viewport width, ~176px
     at 390px); there is no hotspot element (removed per audit C2,
     2026-08-27). pinch-zoom rides along with the
     root value so a browser-applied zoom stays undoable inside the drawer
     too (#45); touch-action intersects down the ancestor chain, so a bare
     pan-y here would cancel the root's pinch permission. */
    touch-action: pan-y pinch-zoom !important;
  }

  /* Closed slot, at the host's OWN specificity. 0.1.5 added a narrow-branch
     rule [data-dsh-frame][data-sidebar-collapsed] [data-pane="sidebar"]
     { width:52px !important; transform:none; pointer-events:none;
     background:transparent !important } - specificity (0,3,0), one class above
     the rule above, so it won BOTH width and transform: the closed drawer
     stayed a 52px transparent shell at x=0 and the only state delta left was
     the width (52<->280), which "transition: transform" cannot animate.
     Measured 2026-09-17: closed pane transform:none / width:52 /
     rect [0,0,52,844], and every frame sampled across a toggle click stayed
     transform:none - the owner's "no slide animation on click" report.
     Matching that specificity (plus !important, since the host declaration is
     important) restores the design's own slot (spec 2026-08-27, drawer DOM):
     a min(88vw, 280px) column translated -110% of its own width, i.e. -308px
     at 390px. The gesture layer never depended on this rule - it writes an
     inline transform !important - so only the CSS-driven click paths regressed. */
  [data-mobile-nav="frame"][data-sidebar-collapsed] > :first-child {
    width: min(88vw, 280px) !important;
    transform: translateX(-110%) !important;
  }

  /* Expanded state (frame without data-sidebar-collapsed) slides the drawer in.
     The open state must be transform:none — NOT translateX(0): an identity
     transform still makes the drawer the containing block for fixed-position
     descendants (the settings dialog's .VOzbGW_overlay is portaled into the
     sidebar DOM). With the identity transform the wide settings sheet
     (100vw-16) overflows the 280px drawer, the dialog's focus scrolls the
     overflow:hidden drawer to scrollLeft=102, and every static child (plus the
     fixed overlay) shifts 102px off-screen. With transform:none the overlay is
     viewport-anchored: it dims the full screen and the sheet sits at left:8. */
  [data-mobile-nav="frame"]:not([data-sidebar-collapsed]) > :first-child {
    transform: none !important;
  }


  /* The host's own drawer handle. It renders the branded fish glyph (a 24x17
     path in a 23.16x17.04 viewBox) and the phone owner reads it as a stray
     "whale" sitting at the very top-left of the header: measured [10,14,44,44]
     against our own toggle at [8,12,28,28], i.e. the two overlap in the same
     corner. It also duplicates what our toggle already does, so on the mobile
     branch it is removed. The selector keys on the host's own label - the
     element carries no distinguishing class (hHd-Xa_iconButton is shared with
     every other icon button, and the label flips to "Collapse sidebar" when the
     drawer is open, which is why the attribute prefix matches both states and
     both get removed). Nothing in this plugin queries that element; the drawer
     still opens from our toggle, the edge swipe, and closes by tapping the
     backdrop or swiping it away. */
  /* Two selectors and both are needed. The competitor is NOT the host's own
     CSS: @linxin666/dsh-web-all injects, under (max-width: 768px),
     [data-dsh-frame][data-sidebar-collapsed] [data-pane="sidebar"]
     [data-dsh-responsive-part="sidebar-toggle"] { pointer-events: auto;
     display: inline-flex !important }. That is 4 attribute selectors AND
     !important - exactly what the first selector below is - so this is NOT an
     out-specify, it is a TIE decided by sheet order, and it holds only because
     our sheet is injected after theirs. Measured twice, not inferred:
     scripts/probes/cascade-conflict-probe.mjs reports both sides imp=true at
     (0,4,0) and lists this as a reviewed order-tie; if the injection order
     flips, the dismiss shadow returns as a visible inline-flex box with
     pointer-events restored. Done (audit D-5 option A, 2026-09-16): every
     selector below carries a leading html, which lifts the first one to
     (0,4,1) and ends the tie - the outcome no longer depends on which sheet is
     injected later. The hash class and the label stay as fallbacks for hosts
     without that hook. */
  html [data-mobile-nav="frame"][data-sidebar-collapsed] [data-pane="sidebar"] [data-dsh-responsive-part="sidebar-toggle"],
  html [data-mobile-nav="frame"] [data-dsh-responsive-part="sidebar-toggle"],
  html [data-mobile-nav="frame"] [class*="hHd-Xa_toggle"]:is([aria-label*="sidebar" i], [aria-label*="侧边栏"]),
  html [data-mobile-nav="frame"] button[aria-label*="sidebar" i],
  html [data-mobile-nav="frame"] button[aria-label*="侧边栏"] {
    display: none !important;
  }

  /* The host's own right sidebar IS the Files panel on phones, and the host
     pins it as a fixed full-bleed sheet: [data-sidebar-right-panel=fullscreen]
     carries position:fixed; inset:0 and no inset of its own (the host CSS
     never mentions safe-area at all). Its top row - the tab strip holding the
     tab label, the + button and the Split / Exit-fullscreen pair at the right
     edge - therefore sat UNDER the status bar: measured at 390x844 with the
     panel open, the strip is [0,0,390,38] and the phone's status bar owns the
     top of the screen. The frame's own safe-area padding cannot reach it: a
     fixed element's containing block is the viewport, not the frame's padding
     box. Taking the inset as padding keeps the panel's own --dsw-alias-bg-base
     covering the whole viewport (no seam behind the status bar) and drops the
     entire row below it, with the right-hand buttons still on the right edge.
     ONLY the fullscreen form: the host's docked form (measured at 820x1180 -
     form=push, position:absolute, 365px right-anchored) has the frame's
     padding box as its containing block, so it already starts below the
     status bar; padding it too would add the inset a second time. A host
     generation that renames the form value should fail the probe loudly
     instead of silently double-padding. The rule lives in the mobile branch,
     so desktop keeps the host layout. */
  [data-sidebar-right-panel="fullscreen"] {
    padding-top: env(safe-area-inset-top, 0px) !important;
  }

  /* prefers-reduced-motion: the drawer's .28s slide is motion; drop it
     (audit S2 2026-08-27 — the old reduce block only covered the settings
     sheet and its mask). Same idiom as the animation:none blocks below. */
  @media (prefers-reduced-motion: reduce) {
    [data-mobile-nav="frame"] > :first-child {
      transition: none !important;
    }
  }

  /* Drag handles are useless on touch and would float over the drawer. */
  [data-side="sidebar"],
  [data-side="details"] {
    display: none !important;
  }

  /* --- Conversation text on mobile ---
     The official message flow keeps desktop's 32px side gutters and 16px
     type. On a phone: shrink the type a notch and widen the lines by
     trimming the gutters (the sidebar drawer list keeps its size). The
     flow's scroll container holds the markdown <p> paragraphs; since
     DSH 0.1.2-rc.1 the composer is a Lexical contenteditable that also
     renders real <p> paragraphs inside its own _scroll container, so the
     composer must be excluded explicitly via
     :not(:has([data-composer-input])). */
  /* The official main scroll body reserves scrollbar-gutter for desktop
     scrollbars (8px), which shoves every column off-center on a phone.
     Classic desktop scrollbars (Edge/Chrome) also occupy ~8-17px in a
     phone-sized viewport, shifting the column further. Mobile scrolling
     is touch/wheel, so remove the scrollbar entirely on phones: the
     column is then exactly centered in every browser. */
  [data-phase] [class*="_scrollBody"] {
    scrollbar-gutter: auto !important;
    scrollbar-width: none;
  }
  [data-phase] [class*="_scrollBody"]::-webkit-scrollbar {
    display: none !important;
    width: 0;
    height: 0;
  }
  /* Message action rows (copy / run-time badges) can overflow the right
     edge on narrow screens — keep them inside the message width. */
  [data-phase] [class*="_actions"] {
    overflow: hidden;
  }
  [data-phase] [class*="_actions"] [class*="_timeEnd"] {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap !important;
  }

  /* Message tooltip bubbles (copy / feedback labels, message-row hover
     bubbles) are redundant on touch: the icon already flips to a checkmark.
     Suppress only inside the actions row — the fork's original scope. On
     this host (0.1.1-rc.2) NO tooltip renders as a visible bubble: the copy
     label is a visuallyHidden span and no client-ui package emits
     role="tooltip". The user message bubble (Sixlwa_bubble since the host moved
     it to dsh-client-ui-chat) and the goal
     bubble (oRe1gG_bubble) live in _userStack/_row, NOT in _actions — the
     previously unscoped selector hid every user message on touch devices
     (2026-09-06 live regression). role="tooltip" stays globally suppressed:
     genuine ARIA tooltips are exactly what the sticky-residue fix targets,
     and nothing legitimate carries the role today. The actions-row arm
     re-activates by itself when a host version renders tooltip labels
     inline in the actions row (DSH 0.1.2 shape). */
  @media (hover: none), (pointer: coarse) {
    [data-phase] [role="tooltip"],
    [data-phase] [class*="_actions"] [class*="_bubble"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  }

  [data-phase]
    [class*="_scroll"]:not([class*="_scrollBody"]):not(:has([data-composer-input])):has(p) {
    padding-left: 20px;
    padding-right: 20px;
    /* Message text follows the host's own font-size axis (Settings -> 字号大小)
       instead of a frozen phone constant. The host writes the user's choice to
       <body> as --dsh-content-font-size and derives the longhand token
       --dsw-font-markdown-base-font-size from it; the previous 15px !important
       cut that chain at the container, so settings 12-17 did nothing for message
       text while the host's own markdown blocks still moved — two sizes mixed in
       one column (#52). Read the longhand token only: the other token ending in
       -base is the font shorthand, an invalid font-size value that the parser
       drops and the cascade silently falls back on. The fallback chain ends at
       the host's own default axis value. */
    font-size: var(--dsw-font-markdown-base-font-size, var(--dsh-content-font-size, 14px)) !important;
  }
  /* Descendants only inherit: the host already resolves the same token on its
     own markdown blocks (and its styles pin 16px on paragraphs / list items),
     so a rule per p / li / user-message text would cut the axis a second time. */
  [data-phase]
    [class*="_scroll"]:not([class*="_scrollBody"]):not(:has([data-composer-input])):has(p) p,
  [data-phase]
    [class*="_scroll"]:not([class*="_scrollBody"]):not(:has([data-composer-input])):has(p) li,
  [data-phase]
    [class*="_scroll"]:not([class*="_scrollBody"]):not(:has([data-composer-input])):has(p) [
      class*="_text_"
    ] {
    font-size: inherit !important;
  }

  /* Markdown tables: the official table uses width:max-content, so on a phone
     it hugs the content and leaves dead space beside/inside the table. Force
     the table to fill the message column and let the table wrapper handle
     overflow if a cell is genuinely too wide. */
  [data-phase] table {
    width: 100%;
    max-width: 100%;
  }
  [data-phase] th,
  [data-phase] td {
    max-width: none;
    min-width: 0;
  }

  /* Markdown images: the official rule often forces width:100%, which
     upscales small square images to the full message column. Show small
     images at their intrinsic size; large / very wide images still scale
     down to fit the column (max-width:100% keeps horizontal panoramas
     adaptive without overflowing). */
  [data-phase] [class*="_scroll"]:not([class*="_scrollBody"]) img {
    width: auto !important;
    max-width: 100% !important;
    height: auto !important;
    /* Cap square / tall images so a big sticker does not dominate the
       narrow column; landscape images stay governed by max-width only.
       The plain px line is the fallback for engines without dvh. */
    max-height: 220px !important;
    max-height: min(40dvh, 220px) !important;
  }

  /* User bubbles: the official stack is capped at min(525px, 82%), which on a
     phone leaves a large blank strip on the left and pushes the bubble high.
     On mobile let the user message fill the same full width as assistant
     messages (the bubble background then spans the whole message column). */
  [data-phase] [class*="_userStack"],
  [data-phase] [class*="_userStack"] [class*="_bubble"] {
    box-sizing: border-box;
    width: fit-content;
    max-width: 100%;
  }

  /* --- Composer bottom row on mobile ---
     The official row contains two lanes: tools (plus + permission/mode
     controls) and trailing (model + context + send). The previous rules made
     the modes lane flex:none, so its full intrinsic width collided with the
     model selector on narrow phones. Keep fixed hit targets fixed, but let
     text-bearing controls shrink and ellipsize before they paint over the
     trailing lane. */
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) {
    box-sizing: border-box;
    container-type: inline-size;
    container-name: dsh-mobile-composer;
    flex-wrap: nowrap;
    gap: 6px;
    padding-left: 6px;
    padding-right: 6px;
    /* The dropdown menu is absolutely positioned inside this row; any
       overflow: hidden here would clip it. Inner lanes keep their own
       overflow clipping, so the row itself can stay visible. */
    overflow: visible;
  }
  /* Dual-primary form (subagent view: stop + send). The four-control
     cluster [model][meter][stop][send] overflows the single-row lane the
     nowrap rule above enforces; the model pill is the only shrinkable
     item, so it collapses to zero and the fixed trio loses its auto
     margin (all hug the lane's left edge, send may even paint off-view).
     Restore the official wrap for this form only: the trailing lane
     drops to a second full-width row where the four controls always
     fit. Main-session three-control form keeps single-row layout. */
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]):has([class*="_primary"] ~ [class*="_primary"]) {
    flex-wrap: wrap;
  }
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > :first-child {
    flex: 0 1 auto;
    min-width: 0;
    gap: 6px;
    /* The permission dropdown (Menu, side: top) pops upward from inside the
       tools lane; overflow hidden here would crop it, same as the row. Text
       ellipsis is handled by the trigger label itself. */
    overflow: visible;
  }
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_trailing"] {
    flex: 1 1 auto;
    min-width: 0;
    gap: 6px;
    /* Must not clip the model dropdown; the model trigger clips its own label. */
    overflow: visible;
  }
  /* Permission / plan controls share the tools lane inside a2's 'div.modes'
     container (class survives as 'css.modes'; audit doc §10.1 / E-1). The
     positional anchor '> :first-child > :nth-child(2)' was already off-target
     on rc.2 (second child = the paperclip button) and dies entirely on a2
     (second child = the hidden file input), so the series re-anchors on the
     modes container itself and is intentionally inert on hosts without one.
     The permission label uses the remaining tools width, while the
     lower-priority plan slot keeps an icon-sized target instead of stealing
     model width. */
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_modes"] {
    flex: 0 1 auto;
    min-width: 0;
    max-width: none;
    gap: 4px;
    /* The permission Menu list (side: top) pops upward out of this lane;
       overflow hidden crops it. The trigger label clips its own text. */
    overflow: visible;
  }
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_modes"] > [class*="_trigger"] {
    flex: 1 1 auto;
    min-width: 28px;
    max-width: 100%;
    display: flex !important;
    overflow: hidden;
  }
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_modes"] > [class*="_trigger"] > [class*="_triggerLabel"] {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap !important;
  }
  /* Slot wrappers such as the live plan chip are not trigger elements. Do
     not force them into an icon-sized box: their child button would overflow
     that wrapper and paint over PermissionSelect. Keep the wrapper intrinsic;
     the model lane below is the one that sacrifices width. */
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_modes"] > :not([class*="_trigger"]) {
    flex: 0 1 auto;
    min-width: 34px;
    max-width: max-content;
    overflow: visible;
  }
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_modes"] > [class*="_wrap"] > [class*="_chip"] {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap !important;
  }
  @container dsh-mobile-composer (max-width: 359px) {
    [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_modes"] > [class*="_trigger"] > [class*="_triggerLabel"] {
      display: none !important;
    }
  }
  /* Model selector: flexible and shrinkable, but never clipped.
     The root must be overflow:visible so the dropdown menu can render.
     The trigger itself clips the label text. */
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_root"]:has(> [class*="_trigger"][aria-haspopup="menu"]) {
    flex: 0 1 auto;
    min-width: 0;
    overflow: visible;
  }
  @container dsh-mobile-composer (max-width: 359px) {
    [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_root"]:has(> [class*="_trigger"][aria-haspopup="menu"]) {
      flex-basis: auto;
    }
  }
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_root"]:has(> [class*="_trigger"][aria-haspopup="menu"]) > [class*="_trigger"] {
    display: flex !important;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
  }
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_root"]:has(> [class*="_trigger"][aria-haspopup="menu"]) > [class*="_trigger"] > [class*="_triggerLabel"] {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap !important;
  }
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_root"]:has(> [class*="_trigger"]):not(:has(> [class*="_trigger"][aria-haspopup="menu"])) {
    flex: 0 0 auto;
  }

  /* Model switcher menu: center the dropdown on the now-shrinkable trigger,
     but never let it exceed the viewport on narrow phones. */
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_root"]:has(> [class*="_trigger"]) > [class*="_menu"] {
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%) !important;
    max-width: min(320px, calc(100vw - 16px));
    box-sizing: border-box;
  }

  /* --- Fix composer row overflow at narrow widths (320px-360px) ---
     Force every direct child of the tools and trailing lanes to shrink,
     so they can fit within the available space without causing horizontal
     overflow. The fixed-size icon buttons are exempt: officially both are
     flex:none at a fixed size (plus 28x28, send 34x34) and must stay put,
     not participate in adaptation. */
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > :first-child > :not([class*="_add"]) {
    flex-shrink: 1;
    min-width: 0;
  }
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_trailing"] > :not([class*="_primary"]) {
    flex-shrink: 1;
    min-width: 0;
  }
  /* Pin the plus button at the left edge of the tools lane: official
     flex:none 28x28, never squeezed by narrower viewports. */
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > :first-child > [class*="_add"] {
    flex: none;
  }
  /* The context meter in the trailing lane is another fixed-size icon
     control: its trigger is officially width:28px flex:none, but the root
     itself is shrinkable, so a squeezed root lets the trigger paint over
     the pinned send button. Keep the whole meter at its natural size; its
     trigger uses aria-haspopup="dialog", so the model-selector menu rules
     (keyed on "menu") still do not apply. */
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_trailing"] > [class*="_root"] {
    flex: none;
    min-width: 0;
  }
  /* ContextMeter (JObwrW_ hash family) hugging the primary key. This single
     value is the whole spacing knob, and because the trigger box is centred on
     the ring ink it doubles as the ink offset:
       6px + margin-right = the sliver before the primary key = the ink's
       leftward shift. 0px (current) therefore shifts the ink 6px -- exactly the
       official lane gap, with no negative-margin trick left in the chain --
       while -6px pins the ink perfectly still and +8px was vetoed on
       2026-09-17 as "too much" (14px). The phone owner asked for a visible
       shift after 1px (-5px) proved imperceptible, and will re-tune this number
       by eye: change it and nothing else moves.
     Anchor on the unique aria-haspopup="dialog" trigger (no other composer
     control uses it), not the hashed class, so an upstream hash bump cannot
     silently unhook us. */
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_trailing"] > [class*="_root"]:has(> [class*="_trigger"][aria-haspopup="dialog"]) {
    margin-right: 0px;
  }
  /* The model pill joins the same right cluster: its margin-left:auto absorbs
     ALL trailing slack, so the adaptive void sits between the tools lane and
     the pill (visible on wide phones/tablets), while [pill][meter][send] stay
     welded together at the right edge on every width. Descendant combinator
     on purpose: the pill root sits behind a display:contents wrapper, so a
     direct-child combinator silently misses (probe-verified). Within the
     trailing lane aria-haspopup="menu" belongs to the model trigger alone. */
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_trailing"] [class*="_root"]:has(> [class*="_trigger"][aria-haspopup="menu"]) {
    margin-left: auto;
    margin-right: -4px;
  }
  /* Grow only the invisible trigger BOX, never the ring ink: 24x24 -> 28x34.
     The WIDTH is capped at 28 by pure geometry, not by taste: the box is
     centred on the ink, and the primary key's hit box begins 14px right of the
     ink's centre, so 28 is the widest box that can reach that boundary without
     stealing a single pixel from the destructive key (the current 1px sliver
     is the spacing knob on the root rule above); the same arithmetic puts the
     left edge on the model pill's edge. The 34px HEIGHT is free: the primary
     key is already the tallest control in the lane, so the box cannot overlap
     anything vertically and the row height does not move. Hit area 576 -> 952
     square px (+65%) with the ink within 1px of its old spot (probe-asserted),
     and the ring's ink stays at its official 14px -- enlarging it is rejected
     as attention-grabbing. Knob: height can drop to 28 if the tap halo should
     be a circle rather than a stadium. */
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_trailing"] > [class*="_root"]:has(> [class*="_trigger"][aria-haspopup="dialog"]) > [class*="_trigger"] {
    width: 28px;
    height: 34px;
    padding: 0;
  }
  /* Slack-absorber priority in the trailing lane: model pill > meter > send.
     Exactly one element carries margin-left:auto so the adaptive void always
     sits BEFORE the welded right cluster, never inside it. The meter itself
     never had an auto before 2026-09-06: in subagent sessions the model seat
     is officially absent (the parent pins the model), and zeroing the send's
     auto on the meter's aria-haspopup="dialog" then left NOTHING to absorb
     slack -- the whole right cluster hugged the lane's left edge (user
     screenshot). Fix: when no model pill renders, the meter root becomes the
     absorber, welding [meter][send] at the right edge like the main view's
     [pill][meter][send]; the send's auto only survives when neither renders. */
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_trailing"]:not(:has([class*="_trigger"][aria-haspopup="menu"])) > [class*="_root"]:has(> [class*="_trigger"][aria-haspopup="dialog"]) {
    margin-left: auto;
  }
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_trailing"] > [class*="_primary"] {
    flex: none;
    margin-left: auto;
  }
  [data-phase] [class*="_card"]:has(textarea, [data-composer-input]) [class*="_row"]:has([class*="_trailing"]) > [class*="_trailing"]:has([class*="_trigger"][aria-haspopup="menu"], > [class*="_root"] > [class*="_trigger"][aria-haspopup="dialog"]) > [class*="_primary"] {
    margin-left: 0;
  }

  /* --- Session header on mobile ---
     Keep the host-owned metadata in one responsive row. The conversation
     title, the mode text and the running/subagent status all keep their
     words; the one tenant that yields width when a phone runs out of it is
     the background-job trigger's verbose label ("1 background job running"),
     while Files keeps its hit area. */
  /* Both !important flags are load-bearing. The host's session-controller sheet
     ships [data-dsh-frame] [data-dsh-responsive-part="conversation-header"] with
     padding-left: 60px !important under (max-width: 768px), so a plain
     declaration here loses however specific it is: measured 2026-09-13 at
     390px, the computed padding-left stayed 60px and the title still began at
     x=100 with our rule present, matching and later in source order. The value
     is 0 because our own toggle already occupies that left seat (painted at
     x=8-36), so the host reservation is pure dead space on a phone. */
  [data-mobile-nav="frame"] [data-phase] header {
    padding-left: 0 !important;
    padding-right: 8px !important;
    position: relative !important;
  }
  /* The hero phase's empty header must stay hidden on phones. The host hides
     it via the headerHidden class at (0,1,0), but its own session-controller
     sheet re-shows the conversation header as a grid at <=768px —
     [data-dsh-frame] [data-dsh-responsive-part="conversation-header"] with
     display grid at (0,2,0) — and that beats the hide on the very element
     carrying both classes. Result measured 2026-09-19 at 390px: an empty 85px
     header paints only its 1px border-bottom (--dsw-alias-border-l3) as a stray
     gray hairline under the status bar (pixel-scanned at y=84-85,
     rgb(224,224,224)); desktop keeps display none and no line. Our (0,3,1)
     re-hide needs no !important: the grid rule's display is a normal
     declaration and our style tag loads last. The header carries no children in
     hero (drawer entry is the FAB), so hiding it frees the dead 85px too. */
  [data-mobile-nav="frame"] [data-phase] header[class*="_headerHidden"] {
    display: none;
  }
  /* Header popovers resolve against the header, not against their 28px flow
     box. 0.1.5's background-job chip anchors its menu with
     position:absolute; top:calc(100% + 5px) inside .QsffPG_root
     {position:relative} — a 28px-tall chip — so the menu was laid out at
     x=-16 (our right:8px resolved against that 156px chip root) and then
     clipped twice: by our own overflow:hidden on the chip root and by the
     host's [data-dsh-responsive-part="session-title-cluster"]
     {overflow:hidden}. The chip still reported aria-expanded=true with
     nothing painted and nothing hit-testable: measured 2026-09-14 at 390px,
     menu rect [-16,49,336,40], elementFromPoint at its centre returned the
     view tabs row. A positioned header plus a static chip root puts the same
     menu at [46,77,336,73] — inside the viewport, its rows hit-testable, and
     an outside tap still dismisses it (menus 1 -> 0).
     BOTH halves are load-bearing: forcing the chip root static without
     positioning the header moves the containing block out to the frame, and
     the menu lands at x=8 y=849 — past the 844px viewport (A/B 2026-09-13).
     Scoped to the header actions slot, so the subagent lineage root inside
     the crumbs keeps its own anchored, fixed-position menu. */
  [data-mobile-nav="frame"] [data-phase] header [class*="_headerActions"] [class*="_root"]:not([class*="_switcherRoot"]):has(> button[class*="_trigger"]) {
    position: static !important;
  }
  /* The tab strip is a separate grid item from the title row and does not
     inherit the title row's inset, so after the header padding above went to 0
     it sat flush against the bezel (measured: tablist x=0, first tab 0..30
     while the title starts at 40). Give it the same left inset as the toggle so
     the two rows read as one column. */
  [data-mobile-nav="frame"] [data-phase] header > [class*="wSkVaW_tabs"] {
    padding-left: 8px !important;
  }
  /* NOTHING extra here on purpose. The header's own padding is already forced
     to 0 above, and the title row carries padding-left:40px of its own, so the
     title lands at x=40 - the toggle's right edge (36) plus 4px. A negative
     margin added on top of that over-corrected and pulled the title off the
     left edge (measured 2026-09-13: crumb x=20, and the string's first glyph
     painted partially outside the viewport), so the reclaim lives in exactly
     one place: the header padding. */

  [data-mobile-nav="frame"] [data-phase] header > :first-child {
    display: flex !important;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    gap: 2px;
    /* Just enough for the toggle (28px at left:8 -> right edge 36) plus 4px of
       breathing room; the host's 60px rail reservation is neutralised above. */
    padding-left: 40px;
  }
  [data-mobile-nav="frame"] [data-phase] header > :first-child > :first-child {
    display: flex !important;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
    gap: 2px;
  }
  /* The directory toggle stays at the far left of the header. */
  [data-mobile-nav="toggle"] {
    position: absolute !important;
    left: 8px !important;
    top: 12px !important;
    z-index: 2 !important;
  }
  /* The files opener is pinned to the header's right corner, mirroring the
     directory toggle on the left (same 8px edge, same 12px seat). In flow it
     can never reach that corner: the host reserves the last 44px of the title
     cluster for a utilities seat that is EMPTY on mobile - measured at 390px,
     headerUtilities sits at x=374 with width 0 while the title cluster carries
     padding-right: 44px - so the button stopped at x=300..328 and left 62px of
     bare header to its right (2026-09-14 phone-side report: the opener is not
     pinned to the top-right corner). Absolute positioning also returns its
     28px of flow width to the title lane, and the containing block is the same
     one the toggle resolves against, so both controls shift together with the
     frame's safe-area padding. The 44px reservation itself is trimmed to the
     28px band this button actually paints in the compact-rows block below, so
     the title lane keeps the difference. */
  [data-mobile-nav="files"] {
    position: absolute !important;
    right: 8px !important;
    left: auto !important;
    top: 12px !important;
    z-index: 2 !important;
  }
  [data-mobile-nav="frame"] [data-phase] header [class*="_headerActions"] {
    display: flex !important;
    align-items: center;
    box-sizing: border-box;
    flex: 0 1 auto;
    min-width: 0;
    max-width: calc(100% - 32px);
    margin-left: auto;
    justify-content: flex-end;
    gap: 2px;
  }
  /* The title takes the remaining width and never paints outside it; the
     metadata lane's mode text is what shrinks first. */
  /* min-width is a readable floor (2026-09-13 phone report: the title showed a
     single glyph then an ellipsis). This lane has flex basis 0, so it is the
     first thing every crowding neighbour eats: measured at 320px with a lineage
     chip in the row, the crumb client width collapsed to 16px and NOTHING of
     the title was painted. 30% of the row keeps 2-4 CJK glyphs plus the host's
     own ellipsis whatever else is pinned next to it. */
  [data-mobile-nav="frame"] [data-phase] header [class*="_crumbs"] {
    flex: 1 1 0;
    min-width: 30%;
    max-width: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap !important;
  }
  /* Mode label: keep the icon AND the words. On a phone this chip is the only
     mode switcher there is, so its text is not the surplus it was once
     treated as: the longest preset name measured needs 121px including the
     18px icon seat, while the old cap min(22vw, 220px) allowed just 85.8px at
     390px — the text was clipped at every phone width even before the
     crowding rules below pinned it to the icon alone (2026-09-14 phone
     report: the mode label showed only its glyph). 38vw keeps the label whole
     from 320px up and still lets it ellipsize before the title on wider
     screens. */
  [data-mobile-nav="frame"] [data-phase] header [class*="_label"]:has(> svg) {
    order: 1;
    flex: 0 1 auto;
    min-width: 0;
    max-width: min(38vw, 220px);
    display: block;
    position: relative;
    box-sizing: border-box;
    padding-left: 18px;
    padding-right: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap !important;
  }
  [data-mobile-nav="frame"] [data-phase] header [class*="_label"]:has(> svg) > svg {
    position: absolute !important;
    left: 0 !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
  }
  /* Running/subagent controls keep their full status text and hit area; they
     do not give up width to the mode label. NOTE: the real subagent lineage
     root has class="ZKlsPq_root " — a TRAILING SPACE from the plugin's
     template-literal className — so [class$="_root"] never matches it. Use
     [class*="_root"] and exclude the switcher root ([class*="_switcherRoot"])
     so only the count/job roots get pinned (the switcher must stay shrinkable
     so its own title can ellipsize). */
  /* Pinned (flex 0 0 auto) with a max-width cap. A shrinkable chip is squeezed
     below its content and the count reads as clipped or overwritten (the
     2026-08-22 report), while a bare max-content pin eats the session title,
     whose flex basis is 0: measured 2026-09-13 at 320px, the crumb went 68px
     -> 16px and the painted title was EMPTY while the chip kept its full text.
     Pinned + capped + the crumbs min-width floor above is what holds both —
     the title ellipsizes, the count keeps its words, and the hit area stays
     one inline-flex button.
     NOTE: the popover containment lives with the header rules above, which
     force this root position:static. That only works together with the
     positioned header: static on its own moved the containing block out to
     the frame and the menu landed at x=8 y=849, past the 844px viewport
     (A/B 2026-09-13). */
  [data-mobile-nav="frame"] [data-phase] header [class*="_root"]:not([class*="_switcherRoot"]):has(> button[class*="_trigger"]) {
    order: 2;
    flex: 0 0 auto;
    min-width: 0;
    max-width: min(40vw, 180px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap !important;
  }
  [data-mobile-nav="frame"] [data-phase] header [class*="_root"]:not([class*="_switcherRoot"]):has(> button[class*="_trigger"]) > button {
    min-width: 0;
    max-width: 100%;
  }
  [data-mobile-nav="frame"] [data-phase] header [class*="_root"]:not([class*="_switcherRoot"]):has(> button[class*="_trigger"]) > button > * {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  [data-mobile-nav="frame"] [data-phase] header [class*="_root"]:not([class*="_switcherRoot"]):has(> button[class*="_trigger"]) > button,
  [data-mobile-nav="frame"] [data-phase] header [class*="_root"]:not([class*="_switcherRoot"]):has(> button[class*="_trigger"]) > button * {
    white-space: nowrap !important;
  }
  /* The lineage count's leading "/" (ZKlsPq_separator — official desktop
     chrome rendered only for a root session inside the crumbs) looks like a
     stray extra breadcrumb level on small screens; hide it. The crumbSep "/"
     between ancestry segments (subagent sessions) is a real separator and
     stays. */
  [data-mobile-nav="frame"] [data-phase] header [class*="_crumbs"] [class*="_separator"] {
    display: none !important;
  }
  /* The header's right-hand slot clips its own dropdown away (0.1.5 host bug).
     wSkVaW_headerUtilities is a 44x44 grid cell with overflow:auto, and the host
     mounts its "More actions" menu INSIDE it: the menu is 218x52, so the cell
     clipped it to 44x44 and the menu was never painted and never hit-testable
     (measured: menu rect 156,56 218x52, computed flex/visible/opacity 1, yet
     elementsFromPoint at the item centre returned the view tabs row and nothing
     from the menu). Raising the menu z-index cannot help - the cell's own
     stacking context traps it. Releasing the overflow paints the menu where the
     host positioned it, and the item then works (verified: a real tap opening
     the session-log export dialog, menus 1 -> 0 dialogs 1). Scoped to the mobile
     branch and to this one cell, so desktop keeps the host layout. The section
     is hidden on mobile anyway - the drawer footer carries the same action - but
     the release stays for any plugin that registers a header dropdown here. */
  [data-mobile-nav="frame"] [data-phase] header [class*="wSkVaW_headerUtilities"] {
    overflow: visible !important;
    /* The seat is empty on a phone (its only button is hidden just below) yet
       still 44px tall, which floors the whole title row — see the compact-rows
       block after the tab strip. */
    height: 30px !important;
    min-height: 0 !important;
  }
  [data-mobile-nav="frame"] [data-phase] header [class*="wSkVaW_headerUtilities"] [class*="nL4_yW_moreButton"] {
    display: none !important;
  }
  [data-mobile-nav="frame"] [data-phase] header [data-mobile-nav="files"] {
    width: 28px;
  }
  /* Session log download: gone from the header row on mobile (the utilities
     seat holds only the session-log-export capsule). */
  [data-mobile-nav="frame"] [data-phase] header > :first-child > :last-child {
    display: none !important;
  }
  /* View tabs strip (official [role="tablist"] under the crumbs row).
     Desktop ships a single flex row (gap: 36) sized for the two stock tabs
     (对话/轨迹). Plugins register further views (memory / skill / todo
     panels, per-plugin settings pages), and once the count passes two the
     shrinkable buttons collapse to their min-content: CJK labels stack one
     glyph per line (staircase), latin labels break word-per-line — the
     strip eats a screenful of vertical space (#41, 8 tabs, HarmonyOS
     browser). Scroll the strip horizontally instead — the standard mobile
     tab-bar pattern — with every label kept whole (flex-shrink: 0 +
     nowrap). Affordance is the peek: the naturally cut-off tab at the right
     edge says "more this way" (unlike the settings navList, whose buttons
     nearly fit and would show no cut edge), which is why this strip scrolls
     while that one wraps. touch-action: pan-x opts the strip into
     horizontal panning — the root's pan-y intersection stops at this first
     scroll container (same mechanism as the drawer's pan-y), so the page
     never scrolls sideways. overscroll-behavior-x: contain stops a flick
     from chaining past the ends; snap keeps tabs edge-aligned after a
     fling; the scrollbar stays hidden like every native tab bar. */
  [data-mobile-nav="frame"] [data-phase] header [role="tablist"] {
    flex-wrap: nowrap;
    gap: 0 16px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    touch-action: pan-x;
    scrollbar-width: none;
  }
  [data-mobile-nav="frame"] [data-phase] header [role="tablist"]::-webkit-scrollbar {
    display: none;
  }
  [data-mobile-nav="frame"] [data-phase] header [role="tablist"] > button {
    flex-shrink: 0;
    white-space: nowrap;
    scroll-snap-align: start;
  }
  /* Compact session header rows (2026-09-14 phone report: the top is very
     empty). The host's own mobile sheet lays the header out as
     grid-template-rows: minmax(32px, auto) minmax(44px, auto) with
     [role="tab"] { min-height: 44px }, and both rows then grow to 44: the
     title row is floored by the empty utilities seat above, the tab row by the
     buttons' own floor. Measured at 390px: header 97px = 8 padding + 44 + 44 +
     1 border, for 36px of painted content. Capping the rows at 36/32 and the
     tabs at their own content height gives 77px, with nothing else degraded —
     title, mode text, status chips, chevrons and both pinned corner buttons
     keep their measured geometry, and the tab strip keeps its #41 contract
     (horizontal scroll, 16px gap, whole labels, pan-x).
     The host's 8px padding-top is deliberately kept: the title row's 28px
     content then centres at y=26, exactly the centre of the pinned corner
     controls (toggle and Files opener both sit at top:12, 28px tall). Trimming
     that padding to 4 shaved 4 more px but left the text row visibly riding
     above both buttons (2026-09-14 phone report: the text row sits too high
     against the drawer and Files controls), so the row height is what pays for
     the compaction, not the alignment.
     :has(> *) guards the hero header: it is an EMPTY, host-hidden grid that
     still occupies 85px while the composer is laid out under it. In the hero
     the header has 0 element children, so the guard leaves it at its official
     height — measured, the hero composer rect [0,349,388,231] is identical
     with and without this block. */
  [data-mobile-nav="frame"] [data-phase] header:has(> *) {
    min-height: 0 !important;
    grid-template-rows: minmax(36px, auto) minmax(32px, auto) !important;
  }
  [data-mobile-nav="frame"] [data-phase] header [role="tab"] {
    min-height: 32px !important;
  }
  /* The title cluster reserves its last 44px for that empty utilities seat,
     while our Files opener only paints a 28px band at right:8 — so 18px of the
     reservation is dead space the title lane can have. Trimming it to 26px
     hands the title 18px back (measured at 390px with a lineage chip present:
     crumb 64 -> 82px) and still clears the opener by 8px (actions right edge
     346 against button left edge 354, with the button keeping its hit test). */
  [data-mobile-nav="frame"] [data-phase] header [class*="wSkVaW_titleCluster"] {
    padding-right: 26px !important;
  }
  /* Header crowding on narrow phones.
     Three tenants want the same row: the session title, the mode chip and the
     status chips. The status chips are the only ones whose words are
     redundant — the background-job chip keeps its state dot, its chevron and
     its aria-label, and the popover above now lists the jobs — so the job
     trigger's verbose label ("1 background job running") is what yields. The
     mode chip is the only mode switcher a phone has and the title is the only
     session identity, so both keep their words and the title ellipsizes
     instead (measured 2026-09-14 at 390px with a lineage chip present: after
     this the mode label keeps 101px of text and the crumb 135px).
     The lineage root (dsh-client-ui-subagent) sits in the crumbs for BOTH
     running and idle descendants, so the guards below key on that root rather
     than the transient running-state dot — otherwise the row would reflow the
     moment agents go idle. Match roots with [class*="_root"] (the real class
     carries a trailing space; [class$="_root"] matches nothing). */
  @media (max-width: 440px) {
    /* The job label is the single widest tenant of the actions lane and the
       only one whose text is already carried elsewhere (aria-label + popover).
       Truncating it to a number instead would print the wrong count for a
       double-digit job list, so it is dropped whole — dot, chevron and tap
       target stay. */
    [data-mobile-nav="frame"] [data-phase] header [class*="_headerActions"] [class*="_root"]:not([class*="_switcherRoot"]):has(> button[class*="_trigger"]) [class*="_count"] {
      display: none !important;
    }
  }
  /* With the subagent lineage (any state) AND a background job present
     together, 390px cannot hold the title, the mode words, the lineage count
     and the job label at once; the job label goes first, above 440px too. */
  @media (max-width: 559px) {
    [data-mobile-nav="frame"] [data-phase] header [class*="_crumbs"] {
      padding-right: 8px;
    }
    [data-mobile-nav="frame"] [data-phase] header:has([class*="_crumbs"] [class*="_root"]) [class*="_headerActions"] [class*="_root"]:not([class*="_switcherRoot"]):has(> button[class*="_trigger"]) [class*="_count"] {
      display: none !important;
    }
  }
  /* Last resort on 320px-class screens: the title and both status chips cannot
     share the row with the mode words, so the mode chip keeps only its icon. */
  @media (max-width: 359px) {
    [data-mobile-nav="frame"] [data-phase] header:has([class*="_crumbs"] [class*="_root"]):has([class*="_headerActions"] [class*="_root"]) [class*="_label"]:has(> svg) {
      display: none !important;
    }
  }

  /* --- Header popovers on mobile (dsh-client-ui-jobs / dsh-client-ui-subagent) --- */
  /* Both entries sit in the session header and both anchor their panel to the
     trigger's left edge (left:0 inside their own root), so clamp them to the
     viewport. The background-job menu resolves against the header (see the
     containment rules at the top of this section) and the subagent lineage
     menu is position:fixed, so right:8px pins either panel 8px from the
     phone's right edge: measured [46,77,336,73] for the job menu and
     [38,41,336,58] for the lineage menu at 390px, both fully inside the
     viewport. Do NOT clamp with left:8px: measured, that put the panel at
     x=350..686 (off-screen) against a right-anchored x=30..366. */
  [data-mobile-nav="frame"] [data-phase] header [class*="_menu"] {
    left: auto !important;
    right: 8px !important;
    width: min(336px, calc(100vw - 16px));
    max-width: none;
    max-height: min(420px, calc(100dvh - 120px));
  }
  /* --- Settings dialog on mobile ---
     Desktop: 800px two-column flex (188px nav + content). Mobile: a
     near-full-width sheet — nav tabs wrap into rows on top, option rows
     stay horizontal (title+description left, control right). Structural
     selectors are scoped to the unique aria-modal dialog; every
     settings-specific rule is gated with
     :has(> :first-child > :last-child > button) — the settings nav tab
     list holds <button> tabs, so the transient export dialog (the same
     primitives Modal, header(title+close)+description+body) keeps its
     official centered card layout. Requires :has() support
     (Chromium 105+, 2022).

     The directory picker (dsh-client-ui-directory-picker-browse) must be
     excluded too: its footer bar holds <button> children AND its breadcrumb
     trail (role="navigation") — which the role gate relies on to exclude
     it — is REPLACED by the path input in edit mode (pencil button), so
     without the ZuhsRW exclusion clicking the pencil would suddenly match
     this sheet rule: the dialog jumps to the top of the screen, the header
     (with the path input) is hidden by the > :first-child > :first-child
     display:none rule below, and the user can no longer type a path
     (issue #12, 2026-08-16). The picker family keeps the official layout
     on mobile in every mode. */
  [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"])) {
    position: absolute !important;
    left: 8px !important;
    /* Fixed top (no translateY): a transform on the panel combined with the
       panel overflowing the max-content drawer shifts the fixed overlay's
       coordinate frame, dragging the whole sidebar content off-screen. The
       safe-area inset keeps the sheet below the status bar / notch. */
    top: calc(env(safe-area-inset-top, 0px) + 12px) !important;
    width: calc(100vw - 16px);
    max-width: calc(100vw - 16px);
    /* Height follows the content (no dead space under a short page); it
       caps at 100dvh-24 (less the safe-area top) and the options area
       scrolls only then. */
    height: auto;
    max-height: min(800px, calc(100vh - 24px - env(safe-area-inset-top, 0px)));
    max-height: min(800px, calc(100dvh - 24px - env(safe-area-inset-top, 0px)));
    flex-direction: column !important;
    border-radius: 14px !important;
    animation: dsh-web-mobile-sheet-in .22s var(--ds-ease-out, ease-in-out);
  }
  /* The settings sheet's dimmed mask fades in with the panel (the mask is
     the first child of the overlay that directly contains the sheet). */
  :has(> [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"]))) > :first-child {
    animation: dsh-web-mobile-fade .18s var(--ds-ease-out, ease-in-out);
  }
  @media (prefers-reduced-motion: reduce) {
    [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"])),
    :has(> [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"]))) > :first-child {
      animation: none !important;
    }
  }
  /* The export dialog (not the settings sheet) must never overflow the
     viewport: the official centered card can be wider than 390px. */
  [aria-modal="true"]:not(:has(> :first-child > :last-child > button)) {
    max-width: calc(100vw - 32px);
  }
  /* Nav bar: hide the "Settings" caption (redundant on a full-width sheet)
     and wrap the tab list so every tab is visible — a horizontal scroll cut
     the last tab ("Plugins") off with no affordance to scroll. */
  [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"])) > :first-child {
    width: 100%;
    flex-direction: row !important;
    align-items: center;
    gap: 6px;
    padding: 10px 12px 8px;
  }
  [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"])) > :first-child > :first-child {
    display: none !important;
  }
  /* The tab list scrolls in the space left by the toolbar: the toolbar
     (config file + close) is reparented INTO this nav row by a client
     reconciler task (settings-toolbar-reparent), so the tab list must be
     anchored by its class, NOT by :last-child (the reparented toolbar
     becomes the nav's new last child). */
  [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"])) > :first-child [class*="_navList"] {
    flex: 1 1 auto;
    min-width: 0;
    flex-direction: row !important;
    flex-wrap: wrap;
    gap: 6px;
    overflow: visible;
  }
  /* Content toolbar (Open configuration file + close): grouped flush to
     the right edge, and reparented INTO the nav row on mobile by the
     settings-toolbar-reparent reconciler task, so it shares one line with
     the tabs (user feedback 2026-08-16 — the toolbar's own row left a
     full-width dead gap under the tabs). Children carry official
     auto-margins that would defeat flex-end, so neutralize them. The close
     button gets a round tappable base so it reads as its own control, not
     part of the outline button.
     Anchored structurally, not by class substring: a bare [class*="_header"]
     also matches every plugin settings card header in the options area —
     the official Plugins config cards (YyYd_a_header) and the dsh-web-ui-all
     group cards (Kwoi6G_header / Jh0q7G_header / rUBhvW_header; the bpnj3G_/jmhvDG_
     siblings were renamed upstream in dsh-web-all 0.3.20, verified 2026-09-18), all sharing the upstream template text-align:left,
     gap:12px, padding:14px 16px). The old broad anchor right-aligned their
     text, gutted the padding and painted a 32px gray circle behind the
     chevron (2026-09-05 sweep: 8 bleeding headers). The toolbar has two
     structural homes, both covered below: after the reparent it is a direct
     child of the nav row ([class*="_nav"]); before the reparent runs it is
     the content column's direct child (the panel's :last-child). Card
     headers live deeper — inside the options scroll area — and match
     neither, so no per-plugin hash guards are needed. */
  [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"])) > [class*="_nav"] > [class*="_header"]:not([class*="_headerActions"]),
  [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"])) > :last-child > [class*="_header"]:not([class*="_headerActions"]) {
    flex: 0 0 auto;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    padding: 0 0 0 4px;
    min-height: 40px;
  }
  [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"])) > [class*="_nav"] > [class*="_header"]:not([class*="_headerActions"]) > *,
  [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"])) > :last-child > [class*="_header"]:not([class*="_headerActions"]) > * {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"])) > [class*="_nav"] > [class*="_header"]:not([class*="_headerActions"]) > :last-child,
  [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"])) > :last-child > [class*="_header"]:not([class*="_headerActions"]) > :last-child {
    width: 32px;
    height: 32px;
    border-radius: 50% !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, .06)) !important;
  }
  /* Appearance mode cards: the official cube row renders three tall
     vertical cards (~268px) that eat half the sheet. Turn them into a
     compact horizontal trio (icon + label inline, equal widths).
     Relies on the official cube-row class name of this version. */
  [aria-modal="true"] [class*="_cubeRow"] {
    gap: 6px;
  }
  [aria-modal="true"] [class*="_cubeRow"] > * {
    flex: 1 1 0;
    flex-direction: row !important;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 8px;
    min-height: 0;
  }
  /* Content: the options scroll area gets bottom breathing room so the last
     row never sits flush against the sheet's rounded corner. */
  [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"])) > :last-child {
    flex: 1 1 auto;
    min-height: 0;
  }
  [aria-modal="true"]:has(> :first-child > :last-child > button):not(:has([role="navigation"])):not(:has([class*="ZuhsRW"])) > :last-child > :last-child {
    padding: 0 12px 24px;
  }
}
`
