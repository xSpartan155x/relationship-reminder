import { useEffect, useState } from 'react'
import WindowFrame from '../components/WindowFrame'
import Footer from '../components/Footer'
import PillButton from '../components/PillButton'
import FloatingHearts from '../components/FloatingHearts'
import { fmtDuration, type Occasion } from '@shared/dateLogic'

export default function GreetingView() {
  const [occ, setOcc] = useState<Occasion | null>(null)

  useEffect(() => {
    window.api.getPayload().then((p) => setOcc(p as Occasion))
    return window.api.onPayloadUpdated((p) => setOcc(p as Occasion))
  }, [])

  function close() {
    window.api.closeWindow()
  }

  if (!occ) return null

  const isAnniv = occ.type === 'anniv'
  const emoji = isAnniv ? '🎉' : '💗'
  const title = isAnniv ? `Buon ${occ.count}° Anniversario!` : `${occ.count}° Mesiversario`
  const body = isAnniv
    ? `Oggi festeggiate ${fmtDuration(occ.months)} insieme. 💍\nFai gli auguri e regala un momento speciale.`
    : `Oggi fate ${fmtDuration(occ.months)} insieme.\nUn messaggio dolce o una piccola sorpresa? 🌹`

  return (
    <WindowFrame
      onClose={close}
      header={
        <div className="drag relative h-[68px] shrink-0 border-b border-blush-line bg-gradient-to-b from-[#FFEEF4] to-blush">
          <span className="absolute left-1/2 top-[9px] h-1 w-9 -translate-x-1/2 rounded-full bg-white/70" />
          <div className="pointer-events-none absolute left-1/2 top-[20px] flex h-[68px] w-[68px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-blush-line bg-white shadow-[0_6px_16px_-4px_rgba(209,45,102,0.35)]">
            <span className="font-emoji text-[28px]">{emoji}</span>
          </div>
        </div>
      }
      footer={
        <Footer>
          <PillButton onClick={close} autoFocus>Grazie ❤</PillButton>
        </Footer>
      }
    >
      {isAnniv && <FloatingHearts />}
      <div className="relative z-10 flex flex-1 flex-col items-center px-8 pt-8 text-center">
        <h1 className="text-[17px] font-bold text-accent-dark">{title}</h1>
        <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">{body}</p>
      </div>
    </WindowFrame>
  )
}
