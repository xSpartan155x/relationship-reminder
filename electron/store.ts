import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

export type Config = {
  start_date?: string
  notify_month: boolean
  notify_anniv: boolean
  trigger_night: boolean
  trigger_morning: boolean
  night_time: string
  morning_time: string
  sound: boolean
  last_greeting_date?: string
}

export const DEFAULTS: Config = {
  notify_month: true,
  notify_anniv: true,
  trigger_night: true,
  trigger_morning: true,
  night_time: '00:00',
  morning_time: '08:00',
  sound: true,
}

const configPath = () => path.join(app.getPath('userData'), 'config.json')

export function loadConfig(): Config {
  try {
    const raw = fs.readFileSync(configPath(), 'utf-8')
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveConfig(cfg: Config): void {
  const p = configPath()
  const tmp = `${p}.tmp`
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), 'utf-8')
  fs.renameSync(tmp, p)
}

export function updateConfig(patch: Partial<Config>): Config {
  const cfg = { ...loadConfig(), ...patch }
  saveConfig(cfg)
  return cfg
}
