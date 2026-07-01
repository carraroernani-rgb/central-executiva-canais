import { useState } from 'react'
import BottomNav from './components/BottomNav'
import HomeScreen from './screens/HomeScreen'
import HistoryScreen from './screens/HistoryScreen'
import SettingsScreen from './screens/SettingsScreen'
import { useMoodData } from './hooks/useMoodData'
import { useMedications } from './hooks/useMedications'
import { useNotifications } from './hooks/useNotifications'

export default function App() {
  const [tab, setTab] = useState('home')
  const moodData = useMoodData()
  const medData = useMedications()
  const { permission, requestPermission } = useNotifications(medData.meds)

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center">
      <div className="w-full max-w-mobile relative">
        {tab === 'home' && (
          <HomeScreen
            moodData={moodData}
            medData={medData}
            permission={permission}
            onRequestPermission={requestPermission}
          />
        )}
        {tab === 'history' && <HistoryScreen records={moodData.records} />}
        {tab === 'settings' && <SettingsScreen meds={medData.meds} />}
        <div className="h-20" />
        <BottomNav tab={tab} onTab={setTab} />
      </div>
    </div>
  )
}
