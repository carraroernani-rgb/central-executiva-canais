export default function AIInsightCard({ insight, loading, error, onRefresh }) {
  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent pulse-dot inline-block"></span>
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">Polar IA</span>
        </div>
        <button onClick={onRefresh}
          className="text-xs text-text3 hover:text-accent transition-colors">
          ↻ Atualizar
        </button>
      </div>

      {loading && (
        <div className="flex gap-1 py-2">
          <span className="w-2 h-2 rounded-full bg-accent dot-1 inline-block"></span>
          <span className="w-2 h-2 rounded-full bg-accent dot-2 inline-block"></span>
          <span className="w-2 h-2 rounded-full bg-accent dot-3 inline-block"></span>
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-text3 italic">{error}</p>
      )}

      {!loading && !error && insight && (
        <p className="text-[13px] text-text2 leading-relaxed">{insight}</p>
      )}

      {!loading && !error && !insight && (
        <p className="text-sm text-text3">Salve seu registro para receber uma análise personalizada.</p>
      )}
    </div>
  )
}
