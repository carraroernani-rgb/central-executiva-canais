const LEVELS = [
  { v: 1, emoji: '🪫', label: 'Sem energia' },
  { v: 2, emoji: '😓', label: 'Cansado' },
  { v: 3, emoji: '😐', label: 'Normal' },
  { v: 4, emoji: '⚡', label: 'Disposto' },
  { v: 5, emoji: '🔥', label: 'Muita energia' },
]

export default function EnergyCard({ value, onChange }) {
  const current = LEVELS.find(l => l.v === value) || LEVELS[2]
  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <p className="text-xs font-medium text-text2 mb-3 uppercase tracking-wide">Energia do dia</p>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{current.emoji}</span>
        <span className="font-medium text-text">{current.label}</span>
      </div>
      <div className="flex gap-2">
        {LEVELS.map(l => (
          <button key={l.v} onClick={() => onChange(l.v)}
            className={`flex-1 py-2 rounded-xl text-xl transition-all ${
              value === l.v ? 'bg-accent/15 scale-110' : 'bg-card2 opacity-50 hover:opacity-80'
            }`}>
            {l.emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
