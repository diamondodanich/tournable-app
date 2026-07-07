import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getUserPlan } from '@/app/actions/billing'
import { getChampionshipPlayerStats, getChampionshipTeamStats } from '@/app/actions/leagues'
import { getSportTheme } from '@/lib/sports'
import PrintButton from './PrintButton'
import type { League } from '@/types'

export const dynamic = 'force-dynamic'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: { back: 'К чемпионату', title: 'Отчёт по всем сезонам', print: 'Скачать PDF', seasons: 'Сезоны', teams: 'Команды', players: 'Игроки', season: 'Сезон', status: 'Статус', active: 'Активный', finished: 'Завершён', topScorers: 'Бомбардиры за всю историю', teamStats: 'Командная статистика', player: 'Игрок', team: 'Команда', g: 'Голы', a: 'Ассисты', gp: 'И', w: 'В', d: 'Н', l: 'П', pts: 'О', generated: 'Сформировано' },
  kz: { back: 'Чемпионатқа', title: 'Барлық маусымдар есебі', print: 'PDF жүктеп алу', seasons: 'Маусымдар', teams: 'Командалар', players: 'Ойыншылар', season: 'Маусым', status: 'Күй', active: 'Белсенді', finished: 'Аяқталды', topScorers: 'Барлық тарих бомбардирлары', teamStats: 'Командалық статистика', player: 'Ойыншы', team: 'Команда', g: 'Голдар', a: 'Ассисттер', gp: 'О', w: 'Ж', d: 'Т', l: 'Ұ', pts: 'Ұп', generated: 'Жасалды' },
  en: { back: 'To championship', title: 'All-seasons report', print: 'Download PDF', seasons: 'Seasons', teams: 'Teams', players: 'Players', season: 'Season', status: 'Status', active: 'Active', finished: 'Finished', topScorers: 'All-time top scorers', teamStats: 'Team statistics', player: 'Player', team: 'Team', g: 'Goals', a: 'Assists', gp: 'P', w: 'W', d: 'D', l: 'L', pts: 'Pts', generated: 'Generated' },
} as const

export default async function ChampionshipReportPage({ params }: { params: Promise<{ leagueId: string }> }) {
  const plan = await getUserPlan()
  if (plan !== 'enterprise') redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const langRaw = cookieStore.get('lang')?.value ?? 'ru'
  const lang: Lang = (['ru', 'kz', 'en'] as Lang[]).includes(langRaw as Lang) ? (langRaw as Lang) : 'ru'
  const tx = T[lang]

  const { leagueId } = await params

  const [{ data: leagueRaw }, { data: seasonsRaw }, { count: teamCount }, playerStats, teamStats] = await Promise.all([
    supabase.from('leagues').select('*').eq('id', leagueId).eq('owner_id', user.id).maybeSingle(),
    supabase.from('seasons').select('name, status').eq('league_id', leagueId).order('created_at', { ascending: false }),
    supabase.from('league_teams').select('*', { count: 'exact', head: true }).eq('league_id', leagueId),
    getChampionshipPlayerStats(leagueId),
    getChampionshipTeamStats(leagueId),
  ])
  if (!leagueRaw) notFound()
  const league = leagueRaw as League
  const seasons = (seasonsRaw ?? []) as { name: string; status: string }[]
  const brand = getSportTheme(league.sport).primary
  const scorers = playerStats.filter(s => s.goals > 0).slice(0, 20)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6 print:hidden">
        <Link href={`/dashboard/leagues/${leagueId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700">
          <ChevronLeft size={14} /> {tx.back}
        </Link>
        <PrintButton label={tx.print} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 print:border-0 print:p-0">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 mb-6" style={{ borderBottom: `3px solid ${brand}` }}>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-gray-900">{league.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{tx.title} · {new Date().toLocaleDateString(lang === 'kz' ? 'kk-KZ' : lang === 'en' ? 'en-US' : 'ru-RU')}</p>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-black tracking-tight" style={{ color: brand }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-green.png" alt="" width={18} height={18} className="w-[18px] h-[18px] object-contain" />
            TOURNABLE
          </span>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[[tx.seasons, seasons.length], [tx.teams, teamCount ?? 0], [tx.players, playerStats.length]].map(([label, val]) => (
            <div key={String(label)} className="border border-gray-100 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-gray-900">{val}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Seasons */}
        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: brand }}>{tx.seasons}</p>
        <table className="w-full text-sm mb-8">
          <thead><tr className="text-gray-400 text-xs border-b border-gray-100"><th className="text-left py-1.5">{tx.season}</th><th className="text-right py-1.5">{tx.status}</th></tr></thead>
          <tbody>
            {seasons.map(s => (
              <tr key={s.name} className="border-b border-gray-50">
                <td className="py-1.5 font-bold text-gray-800">{s.name}</td>
                <td className="py-1.5 text-right text-xs" style={{ color: s.status === 'active' ? '#059669' : '#9ca3af' }}>{s.status === 'active' ? tx.active : tx.finished}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Team stats */}
        {teamStats.length > 0 && (
          <>
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: brand }}>{tx.teamStats}</p>
            <table className="w-full text-sm mb-8">
              <thead><tr className="text-gray-400 text-xs border-b border-gray-100">
                <th className="text-left py-1.5">{tx.team}</th><th className="text-center py-1.5">{tx.gp}</th><th className="text-center py-1.5">{tx.w}</th><th className="text-center py-1.5">{tx.d}</th><th className="text-center py-1.5">{tx.l}</th><th className="text-center py-1.5">{tx.pts}</th>
              </tr></thead>
              <tbody>
                {teamStats.map((s, i) => (
                  <tr key={s.teamName} className="border-b border-gray-50">
                    <td className="py-1.5 font-bold text-gray-800">{i + 1}. {s.teamName}</td>
                    <td className="py-1.5 text-center text-gray-600">{s.GP}</td>
                    <td className="py-1.5 text-center text-emerald-600 font-bold">{s.W}</td>
                    <td className="py-1.5 text-center text-gray-600">{s.D}</td>
                    <td className="py-1.5 text-center text-red-500">{s.L}</td>
                    <td className="py-1.5 text-center font-black text-gray-900">{s.Pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Top scorers */}
        {scorers.length > 0 && (
          <>
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: brand }}>{tx.topScorers}</p>
            <table className="w-full text-sm">
              <thead><tr className="text-gray-400 text-xs border-b border-gray-100">
                <th className="text-left py-1.5 w-6">#</th><th className="text-left py-1.5">{tx.player}</th><th className="text-left py-1.5">{tx.team}</th><th className="text-center py-1.5">{tx.g}</th><th className="text-center py-1.5">{tx.a}</th>
              </tr></thead>
              <tbody>
                {scorers.map((s, i) => (
                  <tr key={`${s.teamName}|${s.player}`} className="border-b border-gray-50">
                    <td className="py-1.5 text-gray-400">{i + 1}</td>
                    <td className="py-1.5 font-bold text-gray-800">{s.player}</td>
                    <td className="py-1.5 text-gray-500">{s.teamName}</td>
                    <td className="py-1.5 text-center font-black" style={{ color: brand }}>{s.goals}</td>
                    <td className="py-1.5 text-center text-gray-600">{s.assists}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
