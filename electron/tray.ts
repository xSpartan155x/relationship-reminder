import { app, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import { VITE_DEV_SERVER_URL, APP_ROOT, RENDERER_DIST } from './paths.js'
import { loadConfig, updateConfig, type Config } from './store.js'
import { openView } from './windows.js'

const iconDir = VITE_DEV_SERVER_URL ? path.join(APP_ROOT, 'public') : RENDERER_DIST
const ICON_PATH = path.join(iconDir, 'icon.ico')

let tray: Tray | null = null
let openSummary: () => void = () => {}

function checkItem(label: string, key: keyof Config) {
  return {
    label,
    type: 'checkbox' as const,
    checked: Boolean(loadConfig()[key]),
    click: () => {
      updateConfig({ [key]: !loadConfig()[key] } as Partial<Config>)
      refreshMenu()
    },
  }
}

function buildMenu(): Menu {
  return Menu.buildFromTemplate([
    { label: 'Riepilogo', click: () => openSummary() },
    { label: 'Imposta data fidanzamento…', click: () => openView('set-date') },
    { type: 'separator' },
    checkItem('Ricorda il mesiversario', 'notify_month'),
    checkItem("Ricorda l'anniversario", 'notify_anniv'),
    checkItem('Avviso a mezzanotte', 'trigger_night'),
    checkItem('Avviso al mattino', 'trigger_morning'),
    checkItem('Suono', 'sound'),
    { label: 'Impostazioni…', click: () => openView('settings') },
    {
      label: 'Mostra augurio di prova',
      click: () => openView('greeting', { type: 'month', count: 7, months: 7 }),
    },
    { type: 'separator' },
    {
      label: 'Avvio automatico con Windows',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: () => {
        const enabled = !app.getLoginItemSettings().openAtLogin
        app.setLoginItemSettings({ openAtLogin: enabled })
        refreshMenu()
      },
    },
    { type: 'separator' },
    { label: 'Esci', click: () => app.quit() },
  ])
}

export function refreshMenu() {
  if (tray) tray.setContextMenu(buildMenu())
}

export function createTray(onOpenSummary: () => void) {
  openSummary = onOpenSummary
  const image = nativeImage.createFromPath(ICON_PATH)
  tray = new Tray(image.isEmpty() ? image : image.resize({ width: 32, height: 32 }))
  tray.setToolTip('Reminder Fidanzamento')
  tray.setContextMenu(buildMenu())
  tray.on('click', () => openSummary())
  return tray
}
