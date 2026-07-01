export async function requestPushPermission() {
  if (!('Notification' in window)) return false
  const perm = await Notification.requestPermission()
  return perm === 'granted'
}

export function scheduleNotification(title, body, delayMs) {
  if (Notification.permission !== 'granted') return
  setTimeout(() => new Notification(title, { body, icon: '/icon-192.png' }), delayMs)
}

export function scheduleMedReminders(medications) {
  medications.forEach(med => {
    const [h, m] = med.time.split(':').map(Number)
    const now = new Date()
    const target = new Date()
    target.setHours(h, m, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 1)
    const delay = target - now
    scheduleNotification(
      `💊 Hora do ${med.name}`,
      `${med.dose} — Não esqueça sua medicação!`,
      delay
    )
    if (med.frequency === '12h') {
      scheduleNotification(
        `💊 Hora do ${med.name}`,
        `${med.dose} — Não esqueça sua medicação!`,
        delay + 12 * 60 * 60 * 1000
      )
    }
    if (med.frequency === '8h') {
      scheduleNotification(`💊 Hora do ${med.name}`, `${med.dose}`, delay + 8 * 60 * 60 * 1000)
      scheduleNotification(`💊 Hora do ${med.name}`, `${med.dose}`, delay + 16 * 60 * 60 * 1000)
    }
  })

  const now = new Date()
  const evening = new Date()
  evening.setHours(20, 0, 0, 0)
  if (evening <= now) evening.setDate(evening.getDate() + 1)
  scheduleNotification('📝 Polar', 'Registre seu humor do dia!', evening - now)
}
