import { ReactNode } from 'react'

export default function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="no-drag flex shrink-0 items-center justify-center gap-3 border-t border-[#F3E4EC] px-6 py-4">
      {children}
    </div>
  )
}
