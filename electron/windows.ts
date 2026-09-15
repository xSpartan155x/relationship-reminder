import { BrowserWindow } from 'electron'
import { VITE_DEV_SERVER_URL, INDEX_HTML, PRELOAD_PATH } from './paths.js'

export type ViewName = 'set-date' | 'summary' | 'settings' | 'greeting'

const VIEW_SIZE: Record<ViewName, { w: number; h: number }> = {
  'set-date': { w: 380, h: 520 },
  summary: { w: 380, h: 372 },
  settings: { w: 380, h: 560 },
  greeting: { w: 380, h: 360 },
}

const openWindows = new Map<ViewName, BrowserWindow>()
const payloads = new Map<number, unknown>()

export function getPayload(windowId: number): unknown {
  return payloads.get(windowId)
}

function fadeTo(win: BrowserWindow, target: number, onDone?: () => void) {
  const step = 0.12
  const tick = () => {
    if (win.isDestroyed()) return
    const current = win.getOpacity()
    const next = target > current ? Math.min(target, current + step) : Math.max(target, current - step)
    win.setOpacity(next)
    if (next !== target) {
      setTimeout(tick, 16)
    } else {
      onDone?.()
    }
  }
  tick()
}

export function openView(view: ViewName, payload?: unknown): BrowserWindow {
  const existing = openWindows.get(view)
  if (existing && !existing.isDestroyed()) {
    payloads.set(existing.id, payload)
    existing.webContents.send('view:payload-updated', payload)
    existing.focus()
    return existing
  }

  const { w, h } = VIEW_SIZE[view]
  const win = new BrowserWindow({
    width: w,
    height: h,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    opacity: 0,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  payloads.set(win.id, payload)
  openWindows.set(view, win)
  win.on('closed', () => {
    openWindows.delete(view)
    payloads.delete(win.id)
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(`${VITE_DEV_SERVER_URL}#${view}`)
  } else {
    win.loadFile(INDEX_HTML, { hash: view })
  }

  win.once('ready-to-show', () => {
    win.show()
    win.focus()
    fadeTo(win, 1)
    // Subito dopo l'avvio di Windows altre finestre possono rubare il topmost:
    // ripetiamo la richiesta un paio di volte cosi' il popup non resta nascosto.
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.setAlwaysOnTop(true)
        win.focus()
      }
    }, 1000)
  })

  return win
}

export function closeWithFade(win: BrowserWindow) {
  fadeTo(win, 0, () => {
    if (!win.isDestroyed()) win.close()
  })
}

export function centerAndShow(win: BrowserWindow) {
  win.center()
}
