const TYPES = ['Caminhada', 'Corrida', 'Academia', 'Yoga', 'Bicicleta', 'Natação', 'Outro']

export default function ExerciseCard({ done, types, onToggle, onTypeToggle }) {
  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-text2 uppercase tracking-wide">Exercício</p>
        <button onClick={onToggle}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            done ? 'bg-accent text-white' : 'bg-card2 text-text2'
          }`}>
          {done ? '✓ Me exercitei' : 'Não me exercitei'}
        </button>
      </div>

      {done && (
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button key={t} onClick={() => onTypeToggle(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                types.includes(t) ? 'bg-accent text-white' : 'bg-card2 text-text2 hover:bg-gray-100'
              }`}>
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
