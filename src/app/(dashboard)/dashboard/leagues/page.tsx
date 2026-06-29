import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Championships now live on the main dashboard alongside tournaments.
export default function LeaguesListRedirect() {
  redirect('/dashboard')
}
