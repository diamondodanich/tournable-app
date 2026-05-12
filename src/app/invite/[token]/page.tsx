import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { acceptInvite } from '@/app/actions/members'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/invite/${token}`)

  const { data: member } = await supabase
    .from('tournament_members')
    .select('*, tournaments(name)')
    .eq('invite_token', token)
    .eq('status', 'pending')
    .single()

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-4">
        <Card className="max-w-sm w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Ссылка недействительна</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-gray-500 text-sm">
            Приглашение уже использовано или истекло.
          </CardContent>
        </Card>
      </div>
    )
  }

  const tournamentName = (member.tournaments as { name: string } | null)?.name ?? 'Турнир'
  const roleLabel = member.role === 'editor' ? 'редактора' : 'наблюдателя'

  async function handleAccept() {
    'use server'
    await acceptInvite(token)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-4">
      <Card className="max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
            <Trophy size={28} className="text-emerald-600" />
          </div>
          <CardTitle className="text-xl">Приглашение</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-700">
            Вас приглашают в турнир <strong>{tournamentName}</strong> в роли <strong>{roleLabel}</strong>.
          </p>
          <form action={handleAccept}>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Принять приглашение
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
