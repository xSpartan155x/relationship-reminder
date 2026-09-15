import { useEffect, useState } from 'react'
import WindowFrame from '../components/WindowFrame'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PillButton from '../components/PillButton'
import Switch from '../components/Switch'
import TimeField from '../components/TimeField'
import type { Config } from '../../electron/store'

function Section({ title, first }: { title: string; first?: boolean }) {
  return (
    <h2 className={`text-[10px] font-bold uppercase tracking-wider text-accent ${first ? 'mt-1' : 'mt-5'} mb-1`}>
      {title}
    </h2>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12px] text-ink">{label}</span>
      {children}
    </div>
  )
}

export default function SettingsView() {
  const [cfg, setCfg] = useState<Config | null>(null)

  useEffect(() => {
    window.api.getConfig().then((c) => setCfg(c))
  }, [])

  function patch(p: Partial<Config>) {
    setCfg((prev) => (prev ? { ...prev, ...p } : prev))
    window.api.setConfig(p)
  }

  function close() {
    window.api.closeWindow()
  }

  if (!cfg) return null

  return (
    <WindowFrame
      onClose={close}
      header={<Header icon="⚙" title="Impostazioni promemoria" compact />}
      footer={
        <Footer>
          <PillButton onClick={close} autoFocus>Fatto</PillButton>
        </Footer>
      }
    >
      <div className="flex-1 overflow-y-auto px-7 pb-1 pt-2">
        <Section title="Cosa ricordare" first />
        <div className="rounded-xl border border-[#F3E4EC] bg-[#FFFBFC] px-3">
          <Row label="Mesiversario (ogni mese)">
            <Switch checked={cfg.notify_month} onChange={(v) => patch({ notify_month: v })} />
          </Row>
          <div className="h-px bg-[#F3E4EC]" />
          <Row label="Anniversario (ogni anno)">
            <Switch checked={cfg.notify_anniv} onChange={(v) => patch({ notify_anniv: v })} />
          </Row>
        </div>

        <Section title="Quando avvisare" />
        <div className="rounded-xl border border-[#F3E4EC] bg-[#FFFBFC] px-3">
          <Row label="A mezzanotte / di notte">
            <Switch checked={cfg.trigger_night} onChange={(v) => patch({ trigger_night: v })} />
          </Row>
          <div className="flex items-center justify-between pb-2.5 pl-1">
            <span className="text-[11px] text-ink-soft">orario</span>
            <TimeField value={cfg.night_time} onChange={(v) => patch({ night_time: v })} />
          </div>
          <div className="h-px bg-[#F3E4EC]" />
          <Row label="Al primo avvio del mattino">
            <Switch checked={cfg.trigger_morning} onChange={(v) => patch({ trigger_morning: v })} />
          </Row>
          <div className="flex items-center justify-between pb-2.5 pl-1">
            <span className="text-[11px] text-ink-soft">orario</span>
            <TimeField value={cfg.morning_time} onChange={(v) => patch({ morning_time: v })} />
          </div>
        </div>

        <Section title="Altro" />
        <div className="rounded-xl border border-[#F3E4EC] bg-[#FFFBFC] px-3">
          <Row label="Suono di notifica">
            <Switch checked={cfg.sound} onChange={(v) => patch({ sound: v })} />
          </Row>
        </div>
      </div>
    </WindowFrame>
  )
}
