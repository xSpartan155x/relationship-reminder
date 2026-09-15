// Logica delle ricorrenze (mesiversario/anniversario), condivisa tra main process e renderer.
// Le date sono sempre rappresentate come mezzanotte locale, per confronti "solo giorno".

export type Occasion = {
  type: 'month' | 'anniv'
  count: number
  months: number
}

export function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// month è 1-12
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month))
}

export function monthsBetween(start: Date, d: Date): number {
  return (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth())
}

export function occasionFor(start: Date, d: Date): Occasion | null {
  if (d.getTime() <= start.getTime()) return null
  const expectedDay = clampDay(d.getFullYear(), d.getMonth() + 1, start.getDate())
  if (d.getDate() !== expectedDay) return null
  const n = monthsBetween(start, d)
  if (n <= 0) return null
  if (n % 12 === 0) return { type: 'anniv', count: n / 12, months: n }
  return { type: 'month', count: n, months: n }
}

export function nextMonthiversary(start: Date, today: Date): Date | null {
  let y = today.getFullYear()
  let m = today.getMonth() + 1 // 1-12
  for (let i = 0; i < 14; i++) {
    const d = new Date(y, m - 1, clampDay(y, m, start.getDate()))
    if (d.getTime() >= today.getTime() && d.getTime() > start.getTime()) return d
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return null
}

export function nextAnniversary(start: Date, today: Date): Date | null {
  let y = today.getFullYear()
  const m = start.getMonth() + 1
  for (let i = 0; i < 3; i++) {
    const d = new Date(y, m - 1, clampDay(y, m, start.getDate()))
    if (d.getTime() >= today.getTime() && d.getTime() > start.getTime()) return d
    y += 1
  }
  return null
}

export function fmtDuration(months: number): string {
  const years = Math.floor(months / 12)
  const rem = months % 12
  const parts: string[] = []
  if (years) parts.push(years === 1 ? '1 anno' : `${years} anni`)
  if (rem) parts.push(rem === 1 ? '1 mese' : `${rem} mesi`)
  return parts.length ? parts.join(' e ') : '0 mesi'
}

export function fmtDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${d.getFullYear()}`
}

export function parseHHMM(s: string): [number, number] {
  try {
    const [hh, mm] = s.split(':').map(Number)
    return [Math.max(0, Math.min(23, hh || 0)), Math.max(0, Math.min(59, mm || 0))]
  } catch {
    return [0, 0]
  }
}

// True se e' il momento di mostrare l'augurio (di oggi, non ancora mostrato).
export function triggerDue(
  nowMin: number,
  nightOn: boolean,
  nightMin: number,
  mornOn: boolean,
  mornMin: number
): boolean {
  if (mornOn && nowMin >= mornMin) return true
  if (nightOn) {
    const upper = mornOn ? mornMin : 24 * 60
    if (nightMin <= upper) {
      if (nightMin <= nowMin && nowMin < upper) return true
    } else {
      // orario notturno oltre quello mattutino: finestra a cavallo di mezzanotte
      if (nowMin >= nightMin || (mornOn && nowMin < mornMin)) return true
    }
  }
  return false
}

export const IT_MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]
export const IT_WD = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
