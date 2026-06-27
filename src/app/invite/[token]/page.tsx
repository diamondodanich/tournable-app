import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

const T = {
  ru: {
    title: 'Приглашение',
    body: (name: string, role: string) => `Вас приглашают в турнир "${name}" в роли ${role}.`,
    editorRole: 'редактора',
    viewerRole: 'наблюдателя',
    btnAccept: 'Принять приглашение',
    invalid: 'Ссылка недействительна',
    invalidDesc: 'Приглашение уже использовано или истекло.',
    error: 'Не удалось принять приглашение. Попробуйте ещё раз.',
  },
  kz: {
    title: 'Шақыру',
    body: (name: string, role: string) => `«${name}» турниріне ${role} ретінде шақырылдыңыз.`,
    editorRole: 'редактор',
    viewerRole: 'бақылаушы',
    btnAccept: 'Шақыруды қабылдау',
    invalid: 'Сілтеме жарамсыз',
    invalidDesc: 'Шақыру қолданылған немесе мерзімі өткен.',
    error: 'Шақыруды қабылдау сәтсіз. Қайталап көріңіз.',
  },
  en: {
    title: 'Invitation',
    body: (name: string, role: string) => `You're invited to tournament "${name}" as ${role}.`,
    editorRole: 'editor',
    viewerRole: 'viewer',
    btnAccept: 'Accept invitation',
    invalid: 'Invalid link',
    invalidDesc: 'The invitation has already been used or has expired.',
    error: 'Could not accept the invitation. Please try again.',
  },
}

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'ru') as 'ru' | 'kz' | 'en'
  const tx = T[lang] ?? T.ru

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/invite/${token}`)

  // SELECT with user session — RLS allows reading pending invites by token
  const { data: member } = await supabase
    .from('tournament_members')
    .select('id, role, status, tournament_id, tournaments(name)')
    .eq('invite_token', token)
    .eq('status', 'pending')
    .single()

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-4">
        <Card className="max-w-sm w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-600">{tx.invalid}</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-gray-500 text-sm">
            {tx.invalidDesc}
          </CardContent>
        </Card>
      </div>
    )
  }

  const tournamentName = (member.tournaments as unknown as { name: string } | null)?.name ?? ''
  const roleLabel = member.role === 'editor' ? tx.editorRole : tx.viewerRole

  async function handleAccept() {
    'use server'
    try {
      const adm = getAdmin()
      const { error } = await adm
        .from('tournament_members')
        .update({ user_id: user!.id, status: 'accepted' })
        .eq('invite_token', token)
        .eq('status', 'pending')

      if (error) {
        console.error('[invite] accept error:', error)
        return
      }
    } catch (e) {
      console.error('[invite] accept exception:', e)
      return
    }

    redirect(`/dashboard/tournament/${member!.tournament_id}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-4">
      <Card className="max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
            <Trophy size={28} className="text-emerald-600" />
          </div>
          <CardTitle className="text-xl">{tx.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-700">
            {tx.body(tournamentName, roleLabel)}
          </p>
          <form action={handleAccept}>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              {tx.btnAccept}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
