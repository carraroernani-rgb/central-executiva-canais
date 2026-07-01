import { useState } from 'react'

export default function MedicationForm({ onSave, onCancel }) {
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [time, setTime] = useState('08:00')
  const [frequency, setFrequency] = useState('diário')

  const handleSave = () => {
    if (!name.trim() || !dose.trim()) return
    onSave({ name: name.trim(), dose: dose.trim(), time, frequency })
  }

  return (
    <div className="bg-card2 rounded-xl p-4 mb-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text2 block mb-1">Medicamento</label>
          <input className="w-full bg-white rounded-lg px-3 py-2 text-sm text-text outline-none focus:ring-1 focus:ring-accent"
            placeholder="Ex: Lamotrigina" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-text2 block mb-1">Dose</label>
          <input className="w-full bg-white rounded-lg px-3 py-2 text-sm text-text outline-none focus:ring-1 focus:ring-accent"
            placeholder="Ex: 100mg" value={dose} onChange={e => setDose(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text2 block mb-1">Horário</label>
          <input type="time" className="w-full bg-white rounded-lg px-3 py-2 text-sm text-text outline-none focus:ring-1 focus:ring-accent"
            value={time} onChange={e => setTime(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-text2 block mb-1">Frequência</label>
          <select className="w-full bg-white rounded-lg px-3 py-2 text-sm text-text outline-none focus:ring-1 focus:ring-accent"
            value={frequency} onChange={e => setFrequency(e.target.value)}>
            <option value="diário">Diário</option>
            <option value="12h">12/12h</option>
            <option value="8h">8/8h</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave}
          className="flex-1 bg-accent text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
          Salvar
        </button>
        <button onClick={onCancel}
          className="flex-1 bg-white text-text2 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  )
}
