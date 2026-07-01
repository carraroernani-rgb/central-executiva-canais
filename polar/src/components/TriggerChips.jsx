import { useState } from 'react'

const DEFAULT_TRIGGERS = [
  { name: 'Álcool', isRisk: true },
  { name: 'Estresse', isRisk: false },
  { name: 'Conflito', isRisk: false },
  { name: 'Falta de sono', isRisk: false },
  { name: 'Isolamento', isRisk: false },
  { name: 'Euforia social', isRisk: false },
  { name: 'Excesso de trabalho', isRisk: false },
]

export default function TriggerChips({ selected, onChange }) {
  const [custom, setCustom] = useState('')
  const [customList, setCustomList] = useState([])
  const all = [...DEFAULT_TRIGGERS, ...customList.map(n => ({ name: n, isRisk: false }))]

  const toggle = (name) => {
    onChange(selected.includes(name) ? selected.filter(t => t !== name) : [...selected, name])
  }

  const addCustom = () => {
    const t = custom.trim()
    if (!t || all.find(a => a.name === t)) return
    setCustomList([...customList, t])
    onChange([...selected, t])
    setCustom('')
  }

  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <p className="text-xs font-medium text-text2 mb-3 uppercase tracking-wide">Gatilhos do dia</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {all.map(t => (
          <button key={t.name} onClick={() => toggle(t.name)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selected.includes(t.name)
                ? t.isRisk ? 'bg-danger text-white' : 'bg-accent text-white'
                : 'bg-card2 text-text2 hover:bg-gray-100'
            }`}>
            {t.isRisk ? '⚠️ ' : ''}{t.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 bg-card2 rounded-xl px-3 py-2 text-sm text-text placeholder-text3 outline-none focus:ring-1 focus:ring-accent"
          placeholder="Adicionar gatilho..."
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
        />
        <button onClick={addCustom}
          className="bg-accent text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
          +
        </button>
      </div>
    </div>
  )
}
