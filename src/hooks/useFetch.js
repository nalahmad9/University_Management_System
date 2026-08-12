// Mahmoud — Reusable fetch hook: loading, data, error, reload
import { useState, useEffect, useCallback } from 'react'

export function useFetch(fetchFn, options = {}) {
  const { immediate = true, onError } = options
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err)
      onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (immediate) load()
  }, [])

  return { data, loading, error, reload: load, setData }
}
