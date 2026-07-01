const QUALITIES = ['ruim', 'ok', 'boa']

export default function SleepCard({ hours, quality, onHoursChange, onQualityChange }) {
  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <p className="text-xs font-medium text-text2 mb-4 uppercase tracking-wide">Sono</p>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text2">Horas dormidas</span>
          <span className="font-semibold text-text">{hours}h</span>
        </div>
        <input type="range" min="0" max="16" step="0.5" value={hours}
          onChange={e => onHoursChange(Number(e.target.value))}
          style={{ background: `linear-gradient(to right, #7C9E87 ${(hours/16)*100}%, #e5e7eb ${(hours/16)*100}%)` }}
        />
        <div className="flex justify-between text-xs text-text3 mt-1">
          <span>0h</span><span>8h</span><span>16h</span>
        </div>
      </div>
      <div>
        <p className="text-sm text-text2 mb-2">Qualidade do sono</p>
        <div className="flex gap-2">
          {QUALITIES.map(q => (
            <button key={q} onClick={() => onQualityChange(q)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                quality === q
                  ? 'bg-accent text-white'
                  : 'bg-card2 text-text2 hover:bg-gray-100'
              }`}>
              {q === 'ruim' ? '😔' : q === 'ok' ? '😐' : '😊'} {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
