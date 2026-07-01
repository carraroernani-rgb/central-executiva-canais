const MOOD_MAP = {
  '-5': '😭', '-4': '😢', '-3': '😞', '-2': '😕', '-1': '😔',
  '0': '😐', '1': '🙂', '2': '😊', '3': '😄', '4': '🤩', '5': '⚡'
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

export default function HistoryList({ records }) {
  if (!records.length) {
    return (
      <div className="text-center py-16 text-text3">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-sm">Nenhum registro ainda.</p>
        <p className="text-xs mt-1">Comece registrando seu humor hoje!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {records.slice(0, 30).map(r => (
        <div key={r.id} className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{MOOD_MAP[String(r.mood)] || '😐'}</span>
            <div>
              <p className="font-medium text-sm text-text capitalize">{formatDate(r.date)}</p>
              <p className="text-xs text-text3">
                Humor: {r.mood > 0 ? `+${r.mood}` : r.mood} · Sono: {r.sleepHours}h ({r.sleepQuality})
              </p>
            </div>
            <span className={`ml-auto text-lg font-bold font-display ${
              r.mood >= 3 ? 'text-warm' : r.mood <= -3 ? 'text-blue' : 'text-accent'
            }`}>
              {r.mood > 0 ? `+${r.mood}` : r.mood}
            </span>
          </div>
          {r.triggers?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {r.triggers.map(t => (
                <span key={t} className="text-xs bg-card2 text-text2 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
          {r.note && <p className="text-xs text-text2 italic">"{r.note}"</p>}
        </div>
      ))}
    </div>
  )
}
