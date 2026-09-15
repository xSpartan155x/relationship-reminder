import { useEffect, useState } from 'react'
import WindowFrame from '../components/WindowFrame'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PillButton from '../components/PillButton'

type SummaryPayload = {
  togetherSince: string
  togetherFor: string
  nextMonthiversary: string
  nextAnniversary: string
}

export default function SummaryView() {
  const [data, setData] = useState<SummaryPayload | null>(null)

  useEffect(() => {
    window.api.getPayload().then((p) => setData(p as SummaryPayload))
    return window.api.onPayloadUpdated((p) => setData(p as SummaryPayload))
  }, [])

  function close() {
    window.api.closeWindow()
  }

  if (!data) return null

  const rows: [string, string][] = [
    ['💘  Insieme da', data.togetherFor],
    ['📅  Fidanzati dal', data.togetherSince],
    ['💗  Prossimo mesiversario', data.nextMonthiversary],
    ['🎉  Prossimo anniversario', data.nextAnniversary],
  ]

  return (
    <WindowFrame
      onClose={close}
      header={<Header icon="💞" title="Il vostro amore in numeri" />}
      footer={
        <Footer>
          <PillButton onClick={close} autoFocus>Chiudi</PillButton>
        </Footer>
      }
    >
      <div className="flex flex-1 flex-col justify-center gap-2.5 px-7">
        {rows.map(([label, value], i) => (
          <div key={label}>
            <div className="flex items-center justify-between py-1">
              <span className="text-[12px] text-ink-soft">{label}</span>
              <span className="text-[13px] font-bold text-ink">{value}</span>
            </div>
            {i < rows.length - 1 && <div className="h-px bg-[#F3E4EC]" />}
          </div>
        ))}
      </div>
    </WindowFrame>
  )
}
