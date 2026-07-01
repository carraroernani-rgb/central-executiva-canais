import { useState } from 'react'
import MedicationForm from './MedicationForm'

export default function MedicationCard({ meds, onAdd, onRemove, onLog, getTodayLog, streak }) {
  const [showForm, setShowForm] = useState(false)

  const handleAdd = (med) => {
    onAdd(med)
    setShowForm(false)
  }

  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-xs font-medium text-text2 uppercase tracking-wide">Medicação</p>
          {streak > 0 && (
            <p className="text-xs text-warm font-semibold mt-0.5">🔥 {streak} dia{streak > 1 ? 's' : ''} em sequência</p>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="text-xs bg-accent text-white px-3 py-1.5 rounded-full font-medium hover:bg-green-700 transition-colors">
          + Adicionar
        </button>
      </div>

      {showForm && <MedicationForm onSave={handleAdd} onCancel={() => setShowForm(false)} />}

      {meds.length === 0 && !showForm && (
        <p className="text-sm text-text3 text-center py-4">Nenhum medicamento cadastrado</p>
      )}

      <div className="space-y-3">
        {meds.map(med => {
          const log = getTodayLog(med.id)
          const taken = log?.status === 'taken'
          const skipped = log?.status === 'skipped'
          return (
            <div key={med.id} className="flex items-center gap-3 p-3 bg-card2 rounded-xl">
              <button onClick={() => onLog(med.id, taken ? null : 'taken')}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  taken ? 'bg-accent border-accent' : 'border-gray-300 bg-white'
                }`}>
                {taken && <span className="text-white text-sm">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-text">{med.name}</p>
                <p className="text-xs text-text3">{med.dose} · {med.time} · {med.frequency}</p>
              </div>
              <div className="flex gap-1">
                {!taken && (
                  <button onClick={() => onLog(med.id, skipped ? null : 'skipped')}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                      skipped ? 'bg-danger text-white' : 'bg-white text-text3 hover:bg-red-50'
                    }`}>
                    Pular
                  </button>
                )}
                <button onClick={() => onRemove(med.id)}
                  className="text-xs px-2 py-1 rounded-lg bg-white text-text3 hover:bg-red-50 hover:text-danger transition-colors">
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
