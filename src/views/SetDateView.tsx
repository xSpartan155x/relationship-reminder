import { useEffect, useState } from 'react'
import WindowFrame from '../components/WindowFrame'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PillButton from '../components/PillButton'
import Calendar from '../components/Calendar'
import { fmtDate, fromISODate, toISODate } from '@shared/dateLogic'

export default function SetDateView() {
  const [selected, setSelected] = useState<Date>(new Date())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    window.api.getConfig().then((cfg) => {
      if (cfg.start_date) setSelected(fromISODate(cfg.start_date))
      setLoaded(true)
    })
  }, [])

  function close() {
    window.api.closeWindow()
  }

  async function confirm() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selected.getTime() > today.getTime()) return
    await window.api.setStartDate(toISODate(selected))
    window.api.openSummary()
    close()
  }

  if (!loaded) return null

  return (
    <WindowFrame
      onClose={close}
      header={<Header icon="💞" title="Da quando state insieme?" />}
      footer={
        <Footer>
          <PillButton onClick={confirm} autoFocus>Salva</PillButton>
          <PillButton onClick={close} variant="muted">Annulla</PillButton>
        </Footer>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-3">
        <Calendar value={selected} onChange={setSelected} />
        <span className="rounded-full bg-blush px-4 py-1.5 text-[11.5px] font-bold text-accent-dark">
          Scelta: {fmtDate(selected)}
        </span>
      </div>
    </WindowFrame>
  )
}
