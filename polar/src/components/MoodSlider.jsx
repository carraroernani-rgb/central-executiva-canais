const MOODS = [
  { v: -5, emoji: '😭', label: 'Depressão grave' },
  { v: -4, emoji: '😢', label: 'Depressão moderada' },
  { v: -3, emoji: '😞', label: 'Depressão leve' },
  { v: -2, emoji: '😕', label: 'Humor baixo' },
  { v: -1, emoji: '😔', label: 'Levemente baixo' },
  { v:  0, emoji: '😐', label: 'Neutro' },
  { v:  1, emoji: '🙂', label: 'Levemente elevado' },
  { v:  2, emoji: '😊', label: 'Bem disposto' },
  { v:  3, emoji: '😄', label: 'Hipomania leve' },
  { v:  4, emoji: '🤩', label: 'Hipomania moderada' },
  { v:  5, emoji: '⚡', label: 'Hipomania intensa' },
]

export default function MoodSlider({ value, onChange }) {
  const current = MOODS.find(m => m.v === value) || MOODS[5]

  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <p className="text-xs font-medium text-text2 mb-4 uppercase tracking-wide">Como você está?</p>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{current.emoji}</span>
        <div>
          <p className="font-semibold text-text">{current.label}</p>
          <p className="text-xs text-text3">{value > 0 ? `+${value}` : value} / 5</p>
        </div>
      </div>
      <input
        type="range" min="-5" max="5" step="1"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right,
            #8FB8C9 0%, #8FB8C9 20%,
            #7C9E87 20%, #7C9E87 60%,
            #E8A87C 60%, #E8A87C 80%,
            #D97C7C 80%, #D97C7C 100%)`
        }}
      />
      <div className="flex justify-between text-xs text-text3 mt-1">
        <span>-5</span><span>0</span><span>+5</span>
      </div>
    </div>
  )
}
