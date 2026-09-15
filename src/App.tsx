import { useEffect, useState } from 'react'
import SetDateView from './views/SetDateView'
import SummaryView from './views/SummaryView'
import SettingsView from './views/SettingsView'
import GreetingView from './views/GreetingView'

function currentView() {
  return window.location.hash.replace('#', '') || 'summary'
}

export default function App() {
  const [view, setView] = useState(currentView())

  useEffect(() => {
    const onHashChange = () => setView(currentView())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  switch (view) {
    case 'set-date':
      return <SetDateView />
    case 'settings':
      return <SettingsView />
    case 'greeting':
      return <GreetingView />
    case 'summary':
    default:
      return <SummaryView />
  }
}
