import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IT_MONTHS, IT_WD } from '@shared/dateLogic'
import WheelPicker from './WheelPicker'

type Props = {
  value: Date
  onChange: (d: Date) => void
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// Genera sempre 6 settimane (42 giorni), cosi' l'altezza del calendario resta
// costante passando da un mese all'altro invece di "saltare" tra 4/5/6 righe.
function getMonthWeeks(year: number, month: number): Date[][] {
  const first = new Date(year, month - 1, 1)
  const firstWeekday = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(start.getDate() - firstWeekday)

  const weeks: Date[][] = []
  const cur = new Date(start)
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

const YEARS_BACK = 120
const GRID_HEIGHT = 6 * 28 + 5 * 3 // 6 righe da 28px + 5 gap da 3px

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 34 : -34, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -34 : 34, opacity: 0 }),
}

export default function Calendar({ value, onChange }: Props) {
  const [viewYear, setViewYear] = useState(value.getFullYear())
  const [viewMonth, setViewMonth] = useState(value.getMonth() + 1)
  const [direction, setDirection] = useState(1)
  const today = useMemo(() => new Date(), [])
  const todayStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()), [today])

  const weeks = useMemo(() => getMonthWeeks(viewYear, viewMonth), [viewYear, viewMonth])

  const maxYear = today.getFullYear()
  const minYear = maxYear - YEARS_BACK

  const monthItems = useMemo(
    () =>
      IT_MONTHS.map((m, i) => ({
        value: i + 1,
        label: m,
        disabled: viewYear === maxYear && i > today.getMonth(),
      })),
    [viewYear, maxYear, today]
  )
  const yearItems = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({ value: minYear + i, label: String(minYear + i) })),
    [minYear, maxYear]
  )

  function goTo(y: number, m: number) {
    const cur = viewYear * 12 + viewMonth
    const next = y * 12 + m
    setDirection(next >= cur ? 1 : -1)
    setViewYear(y)
    setViewMonth(m)
  }

  function handleMonthChange(m: number) {
    goTo(viewYear, m)
  }

  function handleYearChange(y: number) {
    let m = viewMonth
    // se si finisce su un anno il cui mese in vista e' ancora futuro, si
    // ripiega sull'ultimo mese disponibile invece di mostrare un mese "vuoto"
    if (y === maxYear && m - 1 > today.getMonth()) m = today.getMonth() + 1
    goTo(y, m)
  }

  return (
    <div className="w-[276px] select-none rounded-2xl border border-blush-line/70 bg-[#FFFAFB] p-3">
      <div className="flex items-center justify-center gap-1 border-b border-blush-line/60 pb-2">
        <WheelPicker items={monthItems} value={viewMonth} onChange={handleMonthChange} width={92} />
        <WheelPicker items={yearItems} value={viewYear} onChange={handleYearChange} width={64} />
      </div>

      <div className="mt-3 grid grid-cols-7">
        {IT_WD.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold uppercase tracking-wide text-ink-soft/80">
            {d}
          </div>
        ))}
      </div>

      <div className="relative mt-1.5 overflow-hidden" style={{ height: GRID_HEIGHT }}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={`${viewYear}-${viewMonth}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute inset-0 flex flex-col gap-[3px]"
          >
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day, di) => {
                  const isFuture = day.getTime() > todayStart.getTime()
                  const isOtherMonth = day.getMonth() !== viewMonth - 1
                  const isSelected = sameDay(day, value)
                  const isToday = sameDay(day, today)

                  let cls = 'text-ink'
                  if (isOtherMonth || isFuture) cls = 'text-[#D8C6D0]'

                  return (
                    <button
                      key={di}
                      disabled={isFuture}
                      onClick={() => onChange(day)}
                      className={`no-drag relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[12.5px] font-medium transition-colors ${
                        isSelected ? 'font-bold text-white' : isToday ? 'border border-accent text-accent-dark' : cls
                      } ${isFuture ? 'cursor-default' : 'cursor-pointer hover:bg-blush'}`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="calendar-day-highlight"
                          transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                          className="absolute inset-0 rounded-full bg-accent shadow-[0_4px_10px_-2px_rgba(209,45,102,0.6)]"
                        />
                      )}
                      <span className="relative z-10">{day.getDate()}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
