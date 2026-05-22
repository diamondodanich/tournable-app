import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function LandingEnPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const initials = user?.email?.slice(0, 2).toUpperCase()
  return <LandingPage isLoggedIn={!!user} defaultLang="en" userInitials={initials} />
}
