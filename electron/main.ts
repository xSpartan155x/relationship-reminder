import { app, BrowserWindow, ipcMain } from 'electron'
import { loadConfig, updateConfig, saveConfig, type Config } from './store.js'
import { openView, closeWithFade, getPayload } from './windows.js'
import { createTray, refreshMenu } from './tray.js'
import { startScheduler } from './scheduler.js'
import {
  dateOnly,
  fromISODate,
  toISODate,
  monthsBetween,
  nextMonthiversary,
  nextAnniversary,
  fmtDuration,
  fmtDate,
} from '../shared/dateLogic.js'

// Istanza singola: se un'altra copia e' gia' in esecuzione, questa esce subito
// e lascia che sia l'istanza esistente a portarsi in primo piano.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    openSummary()
  })
}

function computeSummary() {
  const cfg = loadConfig()
  if (!cfg.start_date) return null
  const start = fromISODate(cfg.start_date)
  const today = dateOnly(new Date())
  const nextMonth = nextMonthiversary(start, today)
  const nextAnniv = nextAnniversary(start, today)
  return {
    togetherSince: fmtDate(start),
    togetherFor: fmtDuration(monthsBetween(start, today)),
    nextMonthiversary: nextMonth ? fmtDate(nextMonth) : '—',
    nextAnniversary: nextAnniv ? fmtDate(nextAnniv) : '—',
  }
}

function openSummary() {
  const summary = computeSummary()
  if (!summary) {
    openView('set-date')
    return
  }
  openView('summary', summary)
}

function registerIpc() {
  ipcMain.handle('config:get', () => loadConfig())

  ipcMain.handle('config:set', (_e, patch: Partial<Config>) => {
    const cfg = updateConfig(patch)
    refreshMenu()
    return cfg
  })

  ipcMain.handle('config:set-start-date', (_e, isoDate: string) => {
    const cfg = loadConfig()
    delete cfg.last_greeting_date
    cfg.start_date = isoDate
    saveConfig(cfg)
    refreshMenu()
    return cfg
  })

  ipcMain.handle('autostart:get', () => app.getLoginItemSettings().openAtLogin)
  ipcMain.handle('autostart:set', (_e, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled })
    refreshMenu()
    return app.getLoginItemSettings().openAtLogin
  })

  ipcMain.handle('view:get-payload', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win ? getPayload(win.id) : null
  })

  ipcMain.on('open:summary', () => openSummary())
  ipcMain.on('open:set-date', () => openView('set-date'))
  ipcMain.on('open:settings', () => openView('settings'))
  ipcMain.on('open:test-greeting', () => openView('greeting', { type: 'month', count: 7, months: 7 }))

  ipcMain.on('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) closeWithFade(win)
  })
}

app.whenReady().then(() => {
  if (!gotLock) return

  registerIpc()
  createTray(openSummary)
  startScheduler()

  if (!loadConfig().start_date) {
    openView('set-date')
  }
})

// App di tray: aggiungere questo listener (anche vuoto) sovrascrive il quit
// automatico di Electron su Windows/Linux quando si chiudono tutte le finestre.
app.on('window-all-closed', () => {})
