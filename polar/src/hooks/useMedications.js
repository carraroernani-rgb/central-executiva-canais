import { useState } from 'react'

const MEDS_KEY = 'polar_meds'
const LOGS_KEY = 'polar_med_logs'

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] }
}

export function useMedications() {
  const [meds, setMeds] = useState(() => load(MEDS_KEY))
  const [logs, setLogs] = useState(() => load(LOGS_KEY))

  const today = new Date().toISOString().split('T')[0]

  const addMed = (med) => {
    const updated = [...meds, { ...med, id: Date.now() }]
    localStorage.setItem(MEDS_KEY, JSON.stringify(updated))
    setMeds(updated)
  }

  const removeMed = (id) => {
    const updated = meds.filter(m => m.id !== id)
    localStorage.setItem(MEDS_KEY, JSON.stringify(updated))
    setMeds(updated)
  }

  const logMed = (medId, status) => {
    const filtered = logs.filter(l => !(l.medId === medId && l.date === today))
    const updated = [...filtered, { medId, date: today, status, loggedAt: new Date().toISOString() }]
    localStorage.setItem(LOGS_KEY, JSON.stringify(updated))
    setLogs(updated)
  }

  const getTodayLog = (medId) => logs.find(l => l.medId === medId && l.date === today)

  const getTodayTakenCount = () => logs.filter(l => l.date === today && l.status === 'taken').length

  const getStreak = () => {
    if (meds.length === 0) return 0
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const dayLogs = logs.filter(l => l.date === key)
      const allTaken = meds.every(m => dayLogs.some(l => l.medId === m.id && l.status === 'taken'))
      if (allTaken) streak++
      else if (i > 0) break
    }
    return streak
  }

  return { meds, addMed, removeMed, logMed, getTodayLog, getTodayTakenCount, getStreak }
}
