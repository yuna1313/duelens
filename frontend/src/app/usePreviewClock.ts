import { useEffect, useState } from 'react'
import { watchPreviewClock } from './previewClock'

export function usePreviewClock(): number {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const stop = watchPreviewClock({
      now: Date.now,
      schedule: (callback, delay) => { const timer = window.setTimeout(callback, delay); return () => window.clearTimeout(timer) },
    }, setNow)
    const refresh = () => setNow(Date.now())
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { stop(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  return now
}
