import { useState, useEffect } from 'react'
import { requestPushPermission, scheduleMedReminders } from '../services/notifications'

export function useNotifications(meds) {
  const [permission, setPermission] = useState(Notification?.permission || 'default')

  const requestPermission = async () => {
    const granted = await requestPushPermission()
    setPermission(granted ? 'granted' : 'denied')
    return granted
  }

  useEffect(() => {
    if (permission === 'granted' && meds.length > 0) {
      scheduleMedReminders(meds)
    }
  }, [meds, permission])

  return { permission, requestPermission }
}
