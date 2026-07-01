import { useState, useCallback } from 'react'
import { getAIInsight } from '../services/anthropic'

export function useAIInsight() {
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch = useCallback(async (params) => {
    setLoading(true)
    setError(null)
    try {
      const text = await getAIInsight(params)
      setInsight(text)
    } catch (e) {
      setError(e.message === 'NO_KEY' ? 'NO_KEY' : 'Não foi possível conectar ao assistente agora.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { insight, loading, error, fetch }
}
