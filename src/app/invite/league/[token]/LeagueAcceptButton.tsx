'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { acceptLeagueInvite } from '@/app/actions/leagueMembers'

export default function LeagueAcceptButton({ token, label, errorLabel }: { token: string; label: string; errorLabel: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const result = await acceptLeagueInvite(token)
      if (result.error === 'not_authed') { router.push(`/login?next=/invite/league/${token}`); return }
      if (result.error) { setError(result.error); setLoading(false); return }
      router.push(result.slug ? `/leagues/${result.slug}` : '/dashboard')
    } catch {
      setError(errorLabel); setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700">
        {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
        {loading ? '…' : label}
      </Button>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  )
}
