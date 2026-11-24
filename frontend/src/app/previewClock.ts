interface ClockEnvironment {
  now: () => number
  schedule: (callback: () => void, delay: number) => () => void
}

// Refreshes displayed dates and preview plans at the next minute, without sending alarms.
export function watchPreviewClock(environment: ClockEnvironment, onTick: (now: number) => void): () => void {
  let stopped = false
  let cancel: (() => void) | undefined
  function schedule() {
    const now = environment.now()
    cancel = environment.schedule(() => {
      if (stopped) return
      onTick(environment.now())
      schedule()
    }, 60_000 - now % 60_000)
  }
  schedule()
  return () => { stopped = true; cancel?.() }
}
