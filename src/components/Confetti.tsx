import { motion } from 'framer-motion'
import { useMemo } from 'react'

const PIECES = ['❤', '💕', '✨', '💗', '🎉']

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

type Props = {
  count?: number
}

// Piccola esplosione di cuoricini/scintille che parte dal centro del
// contenitore quando il popup compare, per dare un tocco di festa senza
// dover incorporare una gif esterna. Il genitore posiziona il contenitore
// (es. al centro del badge) e questo componente si centra al suo interno.
export default function Confetti({ count = 14 }: Props) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = rand(0, Math.PI * 2)
        const distance = rand(60, 130)
        return {
          id: i,
          emoji: PIECES[Math.floor(rand(0, PIECES.length))],
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance - 20,
          size: rand(12, 20),
          rotate: rand(-90, 90),
          delay: rand(0, 0.15),
          duration: rand(0.8, 1.3),
        }
      }),
    [count]
  )

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-0 w-0 -translate-x-1/2 -translate-y-1/2">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute font-emoji"
          style={{ fontSize: p.size }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 1, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  )
}
