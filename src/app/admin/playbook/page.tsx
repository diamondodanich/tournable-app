import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Oswald } from 'next/font/google'
import Playbook from './Playbook'

const oswald = Oswald({
  subsets: ['latin', 'cyrillic'],
  weight: ['600'],
  variable: '--font-oswald',
})

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Методичка основателя',
  robots: { index: false, follow: false },
}

export default async function AdminPlaybookPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/playbook')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  // Не 403, а 404 — страница не должна выдавать факт своего существования
  if (!profile?.is_admin) notFound()

  // Читается как документ, поэтому по умолчанию светлая — в отличие от презентации
  const theme = (await cookies()).get('theme')?.value === 'dark' ? 'dark' : 'light'

  return (
    <div className={oswald.variable}>
      <Playbook initialTheme={theme} />
    </div>
  )
}
