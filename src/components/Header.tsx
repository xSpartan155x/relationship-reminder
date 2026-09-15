type Props = {
  icon?: string
  title: string
  subtitle?: string
  compact?: boolean
}

export default function Header({ icon, title, subtitle, compact }: Props) {
  return (
    <div
      className={`drag relative flex shrink-0 flex-col items-center justify-center gap-1 border-b border-blush-line bg-gradient-to-b from-[#FFEEF4] to-blush ${
        compact ? 'h-[58px]' : 'h-[80px]'
      }`}
    >
      <span className="absolute top-[9px] h-1 w-9 rounded-full bg-white/70" />
      {icon && <span className={`font-emoji leading-none ${compact ? 'text-base' : 'text-xl'}`}>{icon}</span>}
      <h1 className={`font-bold text-accent-dark ${compact ? 'text-[12px]' : 'text-[14px]'}`}>{title}</h1>
      {subtitle && <p className="text-[10.5px] text-ink-soft/90">{subtitle}</p>}
    </div>
  )
}
