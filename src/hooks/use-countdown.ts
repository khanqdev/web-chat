import { useEffect, useState } from 'react'

/** Số giây còn lại tới thời điểm `until` (ISO-8601), cập nhật mỗi giây; 0 khi đã qua */
export function useCountdown(until: string | null | undefined): number {
  const target = until ? Date.parse(until) : 0
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!target) return
    const id = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= target) window.clearInterval(id)
    }, 1000)
    return () => window.clearInterval(id)
  }, [target])

  return target ? Math.max(0, Math.ceil((target - now) / 1000)) : 0
}

export function formatMmSs(totalSec: number) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
