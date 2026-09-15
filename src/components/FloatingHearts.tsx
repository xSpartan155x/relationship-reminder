import { useMemo } from 'react'

const COUNT = 9

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export default function FloatingHearts() {
  const hearts = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        id: i,
        left: rand(6, 94),
        size: rand(12, 22),
        duration: rand(5, 9),
        delay: rand(0, 6),
      })),
    []
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
