import { ReactNode } from 'react'

type Variant = 'primary' | 'muted'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-dark shadow-[0_8px_20px_-6px_rgba(209,45,102,0.55)]',
  muted: 'bg-[#F3E7ED] text-ink-soft hover:bg-[#E9D6E0] shadow-none',
}

type Props = {
  children: ReactNode
  onClick: () => void
  variant?: Variant
  className?: string
  autoFocus?: boolean
}

export default function PillButton({ children, onClick, variant = 'primary', className = '', autoFocus }: Props) {
  return (
    <button
      onClick={onClick}
      autoFocus={autoFocus}
      className={`no-drag inline-flex min-w-[110px] items-center justify-center gap-1.5 rounded-full px-6 py-2.5 text-[12.5px] font-bold tracking-wide outline-none transition-all duration-150 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-accent-dark/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
