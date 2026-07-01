import { useState } from 'react'
import AlertCard from '../components/AlertCard'
import MoodWave from '../components/MoodWave'
import MoodSlider from '../components/MoodSlider'
import SleepCard from '../components/SleepCard'
import TriggerChips from '../components/TriggerChips'
import MedicationCard from '../components/MedicationCard'
import PushPreview from '../components/PushPreview'
import AIInsightCard from '../components/AIInsightCard'
import ExerciseCard from '../components/ExerciseCard'
import EnergyCard from '../components/EnergyCard'
import SocialCard from '../components/SocialCard'
import { useAIInsight } from '../hooks/useAIInsight'

export default function HomeScreen({ moodData, medData, permission, onRequestPermission }) {
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const saved = moodData.getTodayRecord()
  const [mood, setMood] = useState(saved?.mood ?? 0)
  const [sleepHours, setSleepHours] = useState(saved?.sleepHours ?? 8)
  const [sleepQuality, setSleepQuality] = useState(saved?.sleepQuality ?? 'ok')
  const [triggers, setTriggers] = useState(saved?.triggers ?? [])
  const [note, setNote] = useState(saved?.note ?? '')
  const [exerciseDone, setExerciseDone] = useState(saved?.exerciseDone ?? false)
  const [exerciseTypes, setExerciseTypes] = useState(saved?.exerciseTypes ?? [])
  const [energy, setEnergy] = useState(saved?.energy ?? 3)
  const [social, setSocial] = useState(saved?.social ?? 'normal')
  const [saved2, setSaved2] = useState(false)
  const { insight, loading, error, fetch: fetchInsight } = useAIInsight()
  const history = moodData.getLast7()
  const streak = medData.getStreak()

  const toggleExerciseType = (type) => {
    setExerciseTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleSave = async () => {
    moodData.saveRecord({ mood, sleepHours, sleepQuality, triggers, note, exerciseDone, exerciseTypes, energy, social })
    setSaved2(true)
    await fetchInsight({
      mood, sleepHours, sleepQuality, triggers,
      meds: medData.meds.length, medsTaken: medData.getTodayTakenCount(),
      history: history.map(d => d.mood ?? 0),
      exerciseDone, energy, social
    })
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Polar</h1>
          <p className="text-xs text-text3 capitalize">{today}</p>
        </div>
        <span className="text-2xl">🌊</span>
      </div>

      <AlertCard history={history} triggers={triggers} sleepHours={sleepHours} />
      <MoodWave data={history} />
      <MoodSlider value={mood} onChange={setMood} />
      <EnergyCard value={energy} onChange={setEnergy} />
      <SleepCard hours={sleepHours} quality={sleepQuality} onHoursChange={setSleepHours} onQualityChange={setSleepQuality} />
      <ExerciseCard done={exerciseDone} types={exerciseTypes} onToggle={() => setExerciseDone(p => !p)} onTypeToggle={toggleExerciseType} />
      <SocialCard value={social} onChange={setSocial} />
      <TriggerChips selected={triggers} onChange={setTriggers} />
      <MedicationCard meds={medData.meds} onAdd={medData.addMed} onRemove={medData.removeMed} onLog={medData.logMed} getTodayLog={medData.getTodayLog} streak={streak} />
      <PushPreview meds={medData.meds} permission={permission} onRequestPermission={onRequestPermission} />

      <div className="bg-white rounded-card shadow-card p-4">
        <p className="text-xs font-medium text-text2 mb-2 uppercase tracking-wide">Nota do dia</p>
        <textarea
          className="w-full bg-card2 rounded-xl px-3 py-2 text-sm text-text placeholder-text3 outline-none focus:ring-1 focus:ring-accent resize-none"
          rows={3} placeholder="Como foi seu dia? (opcional)" value={note} onChange={e => setNote(e.target.value)} />
      </div>

      <AIInsightCard insight={insight} loading={loading} error={error} onRefresh={() => fetchInsight({
        mood, sleepHours, sleepQuality, triggers,
        meds: medData.meds.length, medsTaken: medData.getTodayTakenCount(),
        history: history.map(d => d.mood ?? 0),
        exerciseDone, energy, social
      })} />

      <button onClick={handleSave}
        className={`w-full py-4 rounded-card font-semibold text-base transition-all ${saved2 ? 'bg-accent/20 text-accent' : 'bg-accent text-white hover:bg-green-700 active:scale-95'}`}>
        {saved2 ? '✓ Registro salvo!' : 'Salvar registro do dia'}
      </button>
    </div>
  )
}
