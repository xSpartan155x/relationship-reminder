import { useMemo } from 'react'

type Props = {
  variant?: 'soft' | 'festive'
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export default function FloatingHearts({ variant = 'festive' }: Props) {
  const count = variant === 'festive' ? 9 : 5
  const sizeRange: [number, number] = variant === 'festive' ? [12, 22] : [9, 15]
  const opacity = variant === 'festive' ? 1 : 0.55

  const hearts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: rand(6, 94),
        size: rand(sizeRange[0], sizeRange[1]),
        duration: rand(5, 9),
        delay: rand(0, 6),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variant]
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity }}>
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute bottom-0 text-heart"
          style={{
            left: `${h.left}%`,
            fontSize: h.size,
            animation: `float-up ${h.duration}s ease-in ${h.delay}s infinite`,
          }}
        >
          ❤
        </span>
      ))}
    </div>
  )
}
