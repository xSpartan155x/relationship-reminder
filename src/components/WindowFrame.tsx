import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import CloseButton from './CloseButton'

type Props = {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  onClose?: () => void
  bodyClassName?: string
}

export default function WindowFrame({ children, header, footer, onClose, bodyClassName = '' }: Props) {
  return (
    <div
      className="drag h-screen w-screen p-[3px]"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose?.()
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[18px] border border-blush-line bg-white shadow-card"
      >
        {onClose && <CloseButton onClick={onClose} />}
        {header}
        <div className={`flex flex-1 flex-col overflow-hidden ${bodyClassName}`}>{children}</div>
        {footer}
      </motion.div>
    </div>
  )
}
