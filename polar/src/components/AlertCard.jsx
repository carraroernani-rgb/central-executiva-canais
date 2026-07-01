export default function AlertCard({ history, triggers, sleepHours }) {
  const alerts = []

  const moods = history.map(d => d.mood).filter(m => m !== null)
  const last2 = moods.slice(-2)
  const last3 = moods.slice(-3)

  const riskTriggers = ['Álcool', 'álcool']
  const activeRisk = triggers.filter(t => riskTriggers.some(r => t.toLowerCase().includes(r.toLowerCase())))
  if (activeRisk.length) {
    alerts.push({
      type: 'danger',
      icon: '🚨',
      msg: `Gatilho de risco ativo — ${activeRisk[0]} identificado hoje. É um amplificador de humor no transtorno bipolar. Cuide-se com carinho.`
    })
  }

  if (!activeRisk.length) {
    if (last2.length === 2 && last2.every(m => m >= 3)) {
      alerts.push({
        type: 'warm',
        icon: '⚠️',
        msg: 'Padrão de hipomania — Humor elevado detectado por dias seguidos. Monitore seu sono e considere contactar seu psiquiatra.'
      })
    }
    if (last3.length === 3 && last3.every(m => m <= -3)) {
      alerts.push({
        type: 'blue',
        icon: '💙',
        msg: 'Humor persistentemente baixo — Você não está sozinho. Considere conversar com alguém de confiança ou seu médico.'
      })
    }
    if (sleepHours > 0 && (sleepHours < 6 || sleepHours > 10)) {
      alerts.push({
        type: 'blue',
        icon: '😴',
        msg: 'Sono irregular detectado — Sono inadequado é um dos principais gatilhos do transtorno bipolar.'
      })
    }
  }

  if (!alerts.length) return null

  const alert = alerts[0]
  const styles = {
    danger: 'bg-red-50 border-danger text-danger',
    warm:   'bg-orange-50 border-warm text-orange-700',
    blue:   'bg-blue-50 border-blue text-blue-700',
  }

  return (
    <div className={`rounded-card border-l-4 p-4 text-sm leading-relaxed ${styles[alert.type]}`}>
      <span className="font-semibold">{alert.icon} </span>{alert.msg}
    </div>
  )
}
