/// <reference types="vite/client" />

interface Window {
  api: {
    getConfig: () => Promise<import('../electron/store').Config>
    setConfig: (patch: Partial<import('../electron/store').Config>) => Promise<import('../electron/store').Config>
    setStartDate: (isoDate: string) => Promise<import('../electron/store').Config>
    getAutostart: () => Promise<boolean>
    setAutostart: (enabled: boolean) => Promise<boolean>
    getPayload: () => Promise<unknown>
    onPayloadUpdated: (cb: (payload: unknown) => void) => () => void
    openSummary: () => void
    openSetDate: () => void
    openSettings: () => void
    openTestGreeting: () => void
    closeWindow: () => void
    playSound: () => void
  }
}
