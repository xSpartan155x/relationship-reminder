type Props = {
  size?: number
  className?: string
}

// Cuore vettoriale disegnato a mano (stessa forma/gradiente dell'icona
// dell'app), usato al posto dell'emoji ❤️ nei badge: i glifi emoji hanno
// margini interni asimmetrici a seconda del font di sistema e non si
// lasciano centrare in modo affidabile in un cerchio con solo CSS.
export default function HeartIcon({ size = 32, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 29"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heart-icon-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5799F" />
          <stop offset="0.55" stopColor="#E84A7F" />
          <stop offset="1" stopColor="#C2225A" />
        </linearGradient>
      </defs>
      <path
        d="M23.6 0c-3.4 0-6.3 2-7.6 4.9C14.7 2 11.8 0 8.4 0 3.8 0 0 3.8 0 8.4c0 8.9 12.1 16.8 15.4 19.4.3.2.6.3 1 .3s.7-.1 1-.3C20.7 25.2 32 17.3 32 8.4 32 3.8 28.2 0 23.6 0z"
        fill="url(#heart-icon-g)"
      />
      <ellipse
        cx="8.6"
        cy="7.4"
        rx="4.6"
        ry="2.7"
        fill="#FFFFFF"
        opacity="0.38"
        transform="rotate(-28 8.6 7.4)"
      />
    </svg>
  )
}
