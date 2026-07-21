'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import MetricsChart from './MetricsChart'
import type { TimeseriesPoint } from '@/lib/metrics'

// Первая порция приходит с сервера, смена периода догружает клиентом —
// страница не перезагружается, график держит предыдущий кадр приглушённым.
export default function MetricsChartPanel({
  initialData,
  initialDays,
}: {
  initialData: TimeseriesPoint[]
  initialDays: number
}) {
  const [data, setData] = useState(initialData)
  const [days, setDays] = useState(initialDays)
  const [pending, startTransition] = useTransition()

  async function changePeriod(next: number) {
    if (next === days) return
    const prevDays = days
    setDays(next)

    startTransition(async () => {
      const supabase = createClient()
      const { data: rows, error } = await supabase.rpc('metrics_timeseries', { days: next })

      if (error) {
        toast.error(`Не удалось загрузить данные: ${error.message}`)
        setDays(prevDays)
        return
      }
      setData((rows ?? []) as TimeseriesPoint[])
    })
  }

  return (
    <MetricsChart data={data} days={days} onPeriodChange={changePeriod} pending={pending} />
  )
}
