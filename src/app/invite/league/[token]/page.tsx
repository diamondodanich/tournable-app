import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown } from 'lucide-react'
import LeagueAcceptButton from './LeagueAcceptButton'

const T = {
  ru: {
    title: 'Приглашение в чемпионат',
    body: (name: string, role: string) => `Вас приглашают в чемпионат «${name}» в роли ${role}.`,
    editorRole: 'редактора', viewerRole: 'наблюдателя',
    btnAccept: 'Принять приглашение',
    invalid: 'Ссылка недействительна', invalidDesc: 'Приглашение уже использовано или истекло.',
    error: 'Не удалось принять приглашение. Попробуйте ещё раз.',
  },
  kz: {
    title: 'Чемпионатқа шақыру',
    body: (name: string, role: string) => `«${name}» чемпионатына ${role} ретінде шақырылдыңыз.`,
    editorRole: 'редактор', viewerRole: 'бақылаушы',
    btnAccept: 'Шақыруды қабылдау',
    invalid: 'Сілтеме жарамсыз', invalidDesc: 'Шақыру қолданылған немесе мерзімі өткен.',
    error: 'Шақыруды қабылдау сәтсіз. Қайталап көріңіз.',
  },
  en: {
    title: 'Championship invitation',
    body: (name: string, role: string) => `You're invited to championship "${name}" as ${role}.`,
    editorRole: 'editor', viewerRole: 'viewer',
    btnAccept: 'Accept invitation',
    invalid: 'Invalid link', invalidDesc: 'The invitation has already been used or has expired.',
    error: 'Could not accept the invitation. Please try again.',
  },
}

export default async function LeagueInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value ?? 'ru') as 'ru' | 'kz' | 'en'
  const tx = T[lang] ?? T.ru

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/invite/league/${token}`)

  const { data: member } = await supabase
    .from('league_members')
    .select('id, role, status, leagues(name)')
    .eq('invite_token', token)
    .eq('status', 'pending')
    .single()

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-white p-4">
        <Card className="max-w-sm w-full">
          <CardHeader><CardTitle className="text-center text-red-600">{tx.invalid}</CardTitle></CardHeader>
          <CardContent className="text-center text-gray-500 text-sm">{tx.invalidDesc}</CardContent>
        </Card>
      </div>
    )
  }

  const leagueName = (member.leagues as unknown as { name: string } | null)?.name ?? ''
  const roleLabel = member.role === 'editor' ? tx.editorRole : tx.viewerRole

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-white p-4">
      <Card className="max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center mb-3">
            <Crown size={28} className="text-violet-600" />
          </div>
          <CardTitle className="text-xl">{tx.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-700">{tx.body(leagueName, roleLabel)}</p>
          <LeagueAcceptButton token={token} label={tx.btnAccept} errorLabel={tx.error} />
        </CardContent>
      </Card>
    </div>
  )
}
