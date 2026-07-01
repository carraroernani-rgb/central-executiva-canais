import { useEffect, useRef } from 'react'

const DAY_LABELS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export default function MoodWave({ data }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H

    const pad = { l: 12, r: 12, t: 12, b: 28 }
    const chartH = H - pad.t - pad.b
    const chartW = W - pad.l - pad.r
    const n = data.length

    ctx.clearRect(0, 0, W, H)

    // zero line
    const zeroY = pad.t + chartH / 2
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(pad.l, zeroY)
    ctx.lineTo(W - pad.r, zeroY)
    ctx.stroke()
    ctx.setLineDash([])

    const pts = data.map((d, i) => ({
      x: pad.l + (i / (n - 1)) * chartW,
      y: d.mood !== null ? pad.t + (1 - (d.mood + 5) / 10) * chartH : null,
      mood: d.mood,
      date: d.date
    }))

    const validPts = pts.filter(p => p.y !== null)
    if (validPts.length < 2) {
      ctx.fillStyle = '#A0A0A0'
      ctx.font = '12px Inter'
      ctx.textAlign = 'center'
      ctx.fillText('Registre humor para ver o gráfico', W / 2, H / 2)
      return
    }

    // gradient fill
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH)
    grad.addColorStop(0, 'rgba(124,158,135,0.28)')
    grad.addColorStop(1, 'rgba(124,158,135,0)')
    ctx.fillStyle = grad

    ctx.beginPath()
    ctx.moveTo(validPts[0].x, zeroY)
    validPts.forEach((p, i) => {
      if (i === 0) { ctx.lineTo(p.x, p.y); return }
      const prev = validPts[i - 1]
      const cpx = (prev.x + p.x) / 2
      ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y)
    })
    ctx.lineTo(validPts[validPts.length - 1].x, zeroY)
    ctx.closePath()
    ctx.fill()

    // line
    ctx.strokeStyle = '#7C9E87'
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.beginPath()
    validPts.forEach((p, i) => {
      if (i === 0) { ctx.moveTo(p.x, p.y); return }
      const prev = validPts[i - 1]
      const cpx = (prev.x + p.x) / 2
      ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y)
    })
    ctx.stroke()

    // dots
    validPts.forEach(p => {
      let color = '#7C9E87'
      if (p.mood >= 3) color = '#E8A87C'
      else if (p.mood <= -3) color = '#8FB8C9'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = 'white'
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 2.5
      ctx.stroke()
    })

    // day labels
    ctx.fillStyle = '#A0A0A0'
    ctx.font = '10px Inter'
    ctx.textAlign = 'center'
    pts.forEach(p => {
      const d = new Date(p.date + 'T12:00:00')
      ctx.fillText(DAY_LABELS[d.getDay()], p.x, H - 6)
    })
  }, [data])

  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <p className="text-xs font-medium text-text2 mb-3 uppercase tracking-wide">Humor — 7 dias</p>
      <canvas ref={canvasRef} style={{ width: '100%', height: 120, display: 'block' }} />
      <div className="flex gap-4 mt-3 text-xs text-text3">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block"></span>Neutro</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warm inline-block"></span>Elevado</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue inline-block"></span>Baixo</span>
      </div>
    </div>
  )
}
