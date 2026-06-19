import { useEffect, useRef, useState } from 'react'
import type { Item } from '../types'
import { searchItems } from '../services/mockApi'

export interface UseSearchReturn {
  query: string
  setQuery: (q: string) => void
  results: Item[]
  isLoading: boolean
  error: string | null
}

const DEBOUNCE_MS = 300

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tracks the most recently *started* request so stale responses can be ignored.
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isUnmounted = false

    const timerId = setTimeout(() => {
      // Mark this as the latest in-flight request.
      const currentRequestId = ++requestIdRef.current
      setIsLoading(true)
      setError(null)

      searchItems(query)
        .then(items => {
          // Discard if a newer request has since started, or component unmounted.
          if (isUnmounted || currentRequestId !== requestIdRef.current) return
          setResults(items)
          setIsLoading(false)
        })
        .catch((err: unknown) => {
          if (isUnmounted || currentRequestId !== requestIdRef.current) return
          setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
          setIsLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      isUnmounted = true
      clearTimeout(timerId)
    }
  }, [query])

  return { query, setQuery, results, isLoading, error }
}
