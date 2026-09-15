import { useMemo, useState } from 'react'
import { IT_MONTHS, IT_WD } from '@shared/dateLogic'

type Props = {
  value: Date
  onChange: (d: Date) => void
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getMonthWeeks(year: number, month: number): Date[][] {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const firstWeekday = (first.getDay() + 6) % 7
  const lastWeekday = (last.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(start.getDate() - firstWeekday)
  const end = new Date(last)
  end.setDate(end.getDate() + (6 - lastWeekday))

  const weeks: Date[][] = []
  const cur = new Date(start)
  while (cur.getTime() <= end.getTime()) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

function NavButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="no-drag flex h-6 w-6 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-blush hover:text-accent-dark"
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default function Calendar({ value, onChange }: Props) {
  const [viewYear, setViewYear] = useState(value.getFullYear())
  const [viewMonth, setViewMonth] = useState(value.getMonth() + 1)
  const today = useMemo(() => new Date(), [])

  const weeks = useMemo(() => getMonthWeeks(viewYear, viewMonth), [viewYear, viewMonth])

  function shift(dm = 0, dy = 0) {
    let m = viewMonth - 1 + dm
    let y = viewYear + dy + Math.floor(m / 12)
    m = ((m % 12) + 12) % 12
    setViewYear(y)
    setViewMonth(m + 1)
  }

  return (
    <div className="w-[276px] select-none rounded-2xl border border-blush-line/70 bg-[#FFFAFB] p-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <NavButton label="«" onClick={() => shift(0, -1)} />
          <NavButton label="‹" onClick={() => shift(-1, 0)} />
        </div>
        <span className="text-[12.5px] font-bold text-accent-dark">
          {IT_MONTHS[viewMonth - 1]} {viewYear}
        </span>
        <div className="flex gap-1">
          <NavButton label="›" onClick={() => shift(1, 0)} />
          <NavButton label="»" onClick={() => shift(0, 1)} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7">
        {IT_WD.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold uppercase tracking-wide text-ink-soft/80">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex flex-col gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              const isFuture = day.getTime() > today.getTime() && !sameDay(day, today)
              const isOtherMonth = day.getMonth() !== viewMonth - 1
              const isSelected = sameDay(day, value)
              const isToday = sameDay(day, today)
              const disabled = isFuture

              let cls = 'text-ink'
              if (isOtherMonth || isFuture) cls = 'text-[#D8C6D0]'

              return (
                <button
                  key={di}
                  disabled={disabled}
                  onClick={() => onChange(day)}
                  className={`no-drag mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[12.5px] font-medium transition-colors ${
                    isSelected
                      ? 'bg-accent font-bold text-white shadow-[0_4px_10px_-2px_rgba(209,45,102,0.6)]'
                      : isToday
                        ? 'border border-accent text-accent-dark'
                        : cls
                  } ${disabled ? 'cursor-default' : 'cursor-pointer hover:bg-blush'}`}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
