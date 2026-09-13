import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { IconDownloadOutline16, IconPanelLeftOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import { NS } from '../i18n/locales.ts'
import { openFilesPanel } from './open-files-panel.ts'

/** Full props for the sidebar footer action entry. */
export interface MobileDrawerFooterProps extends PropsRuntime<'sidebar.footer.action'>, PropsLocale<typeof NS> {
  /** Bound ctx.sessionLogDownload.download() for the current session. */
  downloadSessionLog: (sessionId: string) => void
  /** Bound ctx.layout.toggleSidebar(): the Files sheet closes the drawer. */
  toggleSidebar: () => void
}

/**
 * Mobile-only drawer footer actions, relocated from the session header to the
 * drawer footer (beside Settings):
 * - Files: opens the file browser — the host's right sidebar when present,
 *   otherwise the dsh-web-ui aionui explorer sheet (see open-files-panel.ts).
 * - Session log: the official session-log-export controller, so the
 *   progress/result dialog is shared with the desktop flow.
 * Hidden entirely on wide screens (CSS media query).
 */
export function MobileDrawerFooter({ useSessions, downloadSessionLog, toggleSidebar, t }: MobileDrawerFooterProps) {
  const sessionId = useSessions((state) => state.current)
  const openExplorer = (): void => {
    // The official right sidebar takes the whole frame, so the drawer must not
    // stay behind it; the third-party explorer sheet is a bottom sheet that
    // needs the drawer closed for the same reason. Either way: open, then
    // close the drawer.
    openFilesPanel()
    toggleSidebar()
  }
  return (
    <div data-mobile-nav="drawer-actions">
      <button
        type="button"
        data-mobile-nav="explorer"
        aria-label={t('files')}
        title={t('files')}
        onClick={openExplorer}
      >
        <IconPanelLeftOutline16 size={14} />
        <span>{t('files')}</span>
      </button>
      <button
        type="button"
        data-mobile-nav="session-log"
        aria-label={t('sessionLog')}
        title={t('sessionLog')}
        disabled={sessionId === undefined}
        onClick={() => {
          if (sessionId !== undefined) downloadSessionLog(sessionId)
        }}
      >
        <IconDownloadOutline16 size={14} />
        <span>{t('sessionLog')}</span>
      </button>
    </div>
  )
}
