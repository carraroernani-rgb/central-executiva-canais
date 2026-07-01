export default function SettingsScreen({ meds }) {
  const exportReport = () => {
    const lines = ['RELATÓRIO POLAR', `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, '']
    const records = JSON.parse(localStorage.getItem('polar_records') || '[]')
    records.slice(0, 14).forEach(r => {
      lines.push(`${r.date} | Humor: ${r.mood} | Sono: ${r.sleepHours}h | Gatilhos: ${r.triggers?.join(', ') || 'nenhum'}`)
      if (r.note) lines.push(`  Nota: ${r.note}`)
    })
    lines.push('', 'Medicamentos:')
    meds.forEach(m => lines.push(`- ${m.name} ${m.dose} — ${m.time} — ${m.frequency}`))
    lines.push('', 'Gerado pelo app Polar')
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `polar-relatorio-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
  }

  return (
    <div className="px-4 pt-5 space-y-4">
      <h2 className="font-display text-xl font-bold text-text">Configurações</h2>

      <div className="bg-white rounded-card shadow-card p-4 space-y-3">
        <p className="text-xs font-medium text-text2 uppercase tracking-wide">Conta</p>
        <input className="w-full bg-card2 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent" placeholder="Seu nome" />
        <select className="w-full bg-card2 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent">
          <option value="">Tipo de bipolar...</option>
          <option>Tipo I</option><option>Tipo II</option><option>Ciclotimia</option>
        </select>
        <input className="w-full bg-card2 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent" placeholder="Nome do psiquiatra" />
      </div>

      <button onClick={exportReport}
        className="w-full bg-accent text-white py-3 rounded-card font-semibold text-sm hover:bg-green-700 transition-colors">
        📄 Exportar relatório para psiquiatra
      </button>

      <p className="text-xs text-center text-text3 pb-4">Polar v0.1 · Todos os dados ficam no seu dispositivo</p>
    </div>
  )
}
