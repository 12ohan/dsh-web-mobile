import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { IconFolderOpenOutline16, IconPanelLeftOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import { NS } from '../i18n/locales.ts'
import { openFilesPanel } from './open-files-panel.ts'

/** Full props for the session-header directory toggle. */
export interface MobileNavToggleProps extends PropsRuntime<'conversation.session.header.actions'>, PropsLocale<typeof NS> {
  /** Bound ctx.layout.toggleSidebar(). */
  toggleSidebar: () => void
}

/**
 * Mobile-only icon buttons next to the session title:
 * - toggle: opens the directory drawer on narrow screens.
 * - files: opens the file browser directly — one tap, no drawer round-trip.
 *   Which surface that is (host right sidebar vs. the third-party explorer
 *   sheet) is decided in open-files-panel.ts. (The drawer footer keeps a Files
 *   entry for the hero/blank phases where this header does not exist.)
 * Hidden entirely on wide screens (CSS media query).
 */
export function MobileNavToggle({ toggleSidebar, t }: MobileNavToggleProps) {
  const toggleExplorer = (): void => {
    openFilesPanel()
  }
  return (
    <>
      <button
        type="button"
        data-mobile-nav="toggle"
        aria-label={t('open')}
        title={t('open')}
        onClick={() => toggleSidebar()}
      >
        <IconPanelLeftOutline16 size={16} />
      </button>
      <button
        type="button"
        data-mobile-nav="files"
        aria-label={t('files')}
        title={t('files')}
        onClick={toggleExplorer}
      >
        <IconFolderOpenOutline16 size={16} />
      </button>
    </>
  )
}
