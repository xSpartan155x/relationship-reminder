type Props = {
  checked: boolean
  onChange: (value: boolean) => void
}

export default function Switch({ checked, onChange }: Props) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`no-drag relative h-[24px] w-[44px] shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-accent' : 'bg-off'
      }`}
    >
      <span
        className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-all duration-200 ${
          checked ? 'left-[23px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}
