import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { Oswald } from 'next/font/google'
import PitchDeck from './PitchDeck'

const oswald = Oswald({
  subsets: ['latin', 'cyrillic'],
  weight: ['600'],
  variable: '--font-oswald',
})

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Питч для инвесторов',
  robots: { index: false, follow: false },
}

export default async function AdminPitchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/pitch')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  // Не 403, а 404 — страница не должна выдавать факт своего существования
  if (!profile?.is_admin) notFound()

  const theme = (await cookies()).get('theme')?.value === 'light' ? 'light' : 'dark'

  return (
    <div className={oswald.variable}>
      <PitchDeck initialTheme={theme} />
    </div>
  )
}
