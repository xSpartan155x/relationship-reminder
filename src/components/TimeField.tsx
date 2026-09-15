import { useState, useEffect } from 'react'

type Props = {
  value: string // "HH:MM"
  onChange: (value: string) => void
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min
  return Math.max(min, Math.min(max, n))
}

export default function TimeField({ value, onChange }: Props) {
  const [hh, mm] = value.split(':')
  const [h, setH] = useState(hh ?? '00')
  const [m, setM] = useState(mm ?? '00')

  useEffect(() => {
    setH(hh ?? '00')
    setM(mm ?? '00')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function commit(nh: string, nm: string) {
    const hn = clamp(parseInt(nh, 10), 0, 23)
    const mn = clamp(parseInt(nm, 10), 0, 59)
    onChange(`${String(hn).padStart(2, '0')}:${String(mn).padStart(2, '0')}`)
  }

  return (
    <div className="no-drag flex items-center gap-1 rounded-lg border border-blush-line bg-[#FFF6F9] px-1.5 py-1">
      <input
        type="number"
        min={0}
        max={23}
        value={h}
        onChange={(e) => setH(e.target.value)}
        onBlur={() => commit(h, m)}
        className="w-6 bg-transparent text-center text-[12.5px] font-bold text-ink outline-none"
      />
      <span className="text-[12px] font-bold text-accent">:</span>
      <input
        type="number"
        min={0}
        max={59}
        value={m}
        onChange={(e) => setM(e.target.value)}
        onBlur={() => commit(h, m)}
        className="w-6 bg-transparent text-center text-[12.5px] font-bold text-ink outline-none"
      />
    </div>
  )
}
