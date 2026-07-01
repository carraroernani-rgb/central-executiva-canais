import { useState, useEffect } from 'react'

const STORAGE_KEY = 'polar_records'

function getRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}

export function useMoodData() {
  const [records, setRecords] = useState(getRecords)

  const saveRecord = (record) => {
    const today = new Date().toISOString().split('T')[0]
    const updated = records.filter(r => r.date !== today)
    updated.unshift({ ...record, date: today, id: Date.now() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setRecords(updated)
  }

  const getLast7 = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const rec = records.find(r => r.date === key)
      days.push({ date: key, mood: rec?.mood ?? null })
    }
    return days
  }

  const getTodayRecord = () => {
    const today = new Date().toISOString().split('T')[0]
    return records.find(r => r.date === today) || null
  }

  return { records, saveRecord, getLast7, getTodayRecord }
}
