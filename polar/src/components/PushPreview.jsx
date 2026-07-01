export default function PushPreview({ meds, permission, onRequestPermission }) {
  const reminders = [...meds.map(m => ({ time: m.time, label: `${m.name} ${m.dose}` }))]
  reminders.push({ time: '20:00', label: 'Registrar humor do dia' })
  reminders.sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <p className="text-xs font-medium text-text2 mb-3 uppercase tracking-wide">Lembretes programados</p>
      {permission !== 'granted' && (
        <button onClick={onRequestPermission}
          className="w-full bg-accent/10 text-accent border border-accent/20 py-2 rounded-xl text-sm font-medium mb-3 hover:bg-accent/20 transition-colors">
          🔔 Ativar notificações
        </button>
      )}
      {reminders.length === 0 ? (
        <p className="text-sm text-text3 text-center py-2">Nenhum lembrete cadastrado</p>
      ) : (
        <div className="space-y-2">
          {reminders.map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-card2 rounded-xl">
              <span className="text-base">🔔</span>
              <span className="text-sm font-medium text-text">{r.time}</span>
              <span className="text-sm text-text2">{r.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
