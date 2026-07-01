const OPTIONS = [
  { v: 'isolado',   emoji: '🏠', label: 'Isolado' },
  { v: 'normal',    emoji: '🤝', label: 'Normal' },
  { v: 'social',    emoji: '🎉', label: 'Muito social' },
]

export default function SocialCard({ value, onChange }) {
  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <p className="text-xs font-medium text-text2 mb-3 uppercase tracking-wide">Sociabilidade</p>
      <div className="flex gap-2">
        {OPTIONS.map(o => (
          <button key={o.v} onClick={() => onChange(o.v)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-sm font-medium transition-all ${
              value === o.v ? 'bg-accent text-white' : 'bg-card2 text-text2 hover:bg-gray-100'
            }`}>
            <span className="text-xl">{o.emoji}</span>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
