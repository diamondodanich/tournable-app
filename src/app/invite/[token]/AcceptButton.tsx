'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { acceptInvite } from '@/app/actions/members'

interface Props {
  token: string
  label: string
  errorLabel: string
}

export default function AcceptButton({ token, label, errorLabel }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const result = await acceptInvite(token)
      if (result.error === 'not_authed') {
        router.push(`/login?next=/invite/${token}`)
        return
      }
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }
      router.push(`/dashboard/tournament/${result.tournamentId}`)
    } catch {
      setError(errorLabel)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
        {loading ? '…' : label}
      </Button>
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  )
}
