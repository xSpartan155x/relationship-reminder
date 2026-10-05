import { useEffect, useRef, useState } from 'react'

type Item = { value: number; label: string; disabled?: boolean }

type Props = {
  items: Item[]
  value: number
  onChange: (value: number) => void
  itemHeight?: number
  visibleCount?: number // dispari, cosi' c'e' una riga centrale vera
  width?: number
}

// Selettore "a rotella" stile iOS: si scorre la colonna (rotellina del mouse
// o trackpad) e il valore che si ferma al centro diventa quello selezionato,
// con effetto di sfumatura/rimpicciolimento in tempo reale sugli altri.
export default function WheelPicker({ items, value, onChange, itemHeight = 30, visibleCount = 3, width = 84 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<number | null>(null)
  const programmatic = useRef(false)
  const padCount = Math.floor(visibleCount / 2)
  const height = itemHeight * visibleCount

  const selectedIndex = Math.max(
    0,
    items.findIndex((it) => it.value === value)
  )
  const [scrollTop, setScrollTop] = useState(selectedIndex * itemHeight)

  // se il valore cambia da fuori (es. mese aggiustato da un altro controllo),
  // riallinea la rotella senza rieseguire la logica di "assestamento".
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const target = selectedIndex * itemHeight
    if (Math.abs(el.scrollTop - target) > 1) {
      programmatic.current = true
      el.scrollTop = target
      setScrollTop(target)
      requestAnimationFrame(() => {
        programmatic.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, itemHeight])

  function settle(scrollTopNow: number) {
    const idx = Math.max(0, Math.min(items.length - 1, Math.round(scrollTopNow / itemHeight)))
    const item = items[idx]
    const el = ref.current
    if (item?.disabled) {
      // niente selezione oltre il limite consentito: torna all'ultimo valido
      const fallback = items.findIndex((it) => it.value === value)
      el?.scrollTo({ top: fallback * itemHeight, behavior: 'smooth' })
      return
    }
    if (item && item.value !== value) onChange(item.value)
    el?.scrollTo({ top: idx * itemHeight, behavior: 'smooth' })
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const st = e.currentTarget.scrollTop
    setScrollTop(st)
    if (programmatic.current) return
    if (settleTimer.current) window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => settle(st), 130)
  }

  function pick(i: number) {
    if (items[i]?.disabled) return
    ref.current?.scrollTo({ top: i * itemHeight, behavior: 'smooth' })
  }

  const centerContinuous = scrollTop / itemHeight

  return (
    <div className="relative select-none overflow-hidden" style={{ height, width }}>
      <div
        ref={ref}
        onScroll={handleScroll}
        className="no-drag h-full overflow-y-scroll [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        <div style={{ height: itemHeight * padCount }} />
        {items.map((it, i) => {
          const dist = Math.abs(i - centerContinuous)
          const opacity = it.disabled ? 0.25 : Math.max(0.28, 1 - dist * 0.38)
          const scale = Math.max(0.8, 1 - dist * 0.14)
          return (
            <div
              key={it.value}
              onClick={() => pick(i)}
              style={{
                height: itemHeight,
                scrollSnapAlign: 'center',
                opacity,
                transform: `scale(${scale})`,
              }}
              className={`flex items-center justify-center text-[13px] transition-transform ${
                it.disabled ? 'cursor-default text-ink-soft' : 'cursor-pointer text-ink'
              } ${dist < 0.5 ? 'font-bold text-accent-dark' : ''}`}
            >
              {it.label}
            </div>
          )
        })}
        <div style={{ height: itemHeight * padCount }} />
      </div>
      <div
        className="pointer-events-none absolute left-0 right-0 rounded-md border-y border-blush-line bg-blush/25"
        style={{ top: itemHeight * padCount, height: itemHeight }}
      />
    </div>
  )
}
