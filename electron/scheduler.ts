import { shell } from 'electron'
import { loadConfig, updateConfig } from './store.js'
import { openView } from './windows.js'
import {
  dateOnly,
  fromISODate,
  toISODate,
  occasionFor,
  parseHHMM,
  triggerDue,
} from '../shared/dateLogic.js'

const CHECK_INTERVAL_MS = 30_000
let timer: ReturnType<typeof setInterval> | null = null

export function showGreeting(occ: { type: 'month' | 'anniv'; count: number; months: number }) {
  const cfg = loadConfig()
  if (cfg.sound) {
    try {
      shell.beep()
    } catch {
      // ignora: il beep di sistema non e' disponibile su questa piattaforma
    }
  }
  openView('greeting', occ)
}

function tick() {
  try {
    const cfg = loadConfig()
    if (!cfg.start_date) return

    const start = fromISODate(cfg.start_date)
    const now = new Date()
    const today = dateOnly(now)

    let occ = occasionFor(start, today)
    if (occ && occ.type === 'month' && !cfg.notify_month) occ = null
    if (occ && occ.type === 'anniv' && !cfg.notify_anniv) occ = null

    const already = cfg.last_greeting_date === toISODate(today)
    if (occ && !already) {
      const [nh, nm] = parseHHMM(cfg.night_time)
      const [mh, mm] = parseHHMM(cfg.morning_time)
      const due = triggerDue(
        now.getHours() * 60 + now.getMinutes(),
        cfg.trigger_night,
        nh * 60 + nm,
        cfg.trigger_morning,
        mh * 60 + mm
      )
      if (due) {
        showGreeting(occ)
        updateConfig({ last_greeting_date: toISODate(today) })
      }
    }
  } catch (err) {
    console.error('[scheduler] errore nel controllo periodico:', err)
  }
}

export function startScheduler() {
  if (timer) return
  tick()
  timer = setInterval(tick, CHECK_INTERVAL_MS)
}

export function stopScheduler() {
  if (timer) clearInterval(timer)
  timer = null
}
