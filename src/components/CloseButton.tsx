type Props = {
  onClick: () => void
}

export default function CloseButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Chiudi"
      className="no-drag absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full text-[13px] text-ink-soft/80 transition-colors hover:bg-black/[0.04] hover:text-accent-dark"
    >
      ✕
    </button>
  )
}
