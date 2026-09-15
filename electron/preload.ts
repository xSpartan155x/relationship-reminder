import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (patch: Record<string, unknown>) => ipcRenderer.invoke('config:set', patch),
  setStartDate: (isoDate: string) => ipcRenderer.invoke('config:set-start-date', isoDate),

  getAutostart: () => ipcRenderer.invoke('autostart:get'),
  setAutostart: (enabled: boolean) => ipcRenderer.invoke('autostart:set', enabled),

  getPayload: () => ipcRenderer.invoke('view:get-payload'),
  onPayloadUpdated: (cb: (payload: unknown) => void) => {
    const listener = (_e: unknown, payload: unknown) => cb(payload)
    ipcRenderer.on('view:payload-updated', listener)
    return () => ipcRenderer.removeListener('view:payload-updated', listener)
  },

  openSummary: () => ipcRenderer.send('open:summary'),
  openSetDate: () => ipcRenderer.send('open:set-date'),
  openSettings: () => ipcRenderer.send('open:settings'),
  openTestGreeting: () => ipcRenderer.send('open:test-greeting'),

  closeWindow: () => ipcRenderer.send('window:close'),
  playSound: () => ipcRenderer.send('sound:beep'),
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
