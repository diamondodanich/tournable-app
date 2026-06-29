import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// The old simple league form is replaced by the championship wizard.
export default function NewLeagueRedirect() {
  redirect('/dashboard/new?type=championship')
}
