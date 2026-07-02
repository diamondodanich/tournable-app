'use client'

import { useEffect, useState } from 'react'
import { Tournament, Team, TournamentMember } from '@/types'
import { addTeam, removeTeam, generateSchedule, renameTournament, updateTournamentSettings } from '@/app/actions/tournaments'
import { removeMember } from '@/app/actions/members'
import { deleteTournament } from '@/app/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Zap, Users, Settings2, Check, Pencil, Sliders, Loader2, LayoutTemplate, UserCog, UserX, Clock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import TeamLogoUpload from './TeamLogoUpload'
import TournamentLogoUpload from './TournamentLogoUpload'
import TournamentCoverPicker from './TournamentCoverPicker'
import TournamentCoverBanner from './TournamentCoverBanner'
import { createClient } from '@/lib/supabase/client'
import { tx, type Lang } from '@/lib/i18n'

const TAB_CLASS = `inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold whitespace-nowrap
  text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all
  data-[active]:bg-emerald-600 data-[active]:text-white data-[active]:shadow-sm`

export default function SetupTab({
  tournament, teams, members: initialMembers = [], isOwner = false, lang = 'ru',
}: {
  tournament: Tournament
  teams: Team[]
  members?: TournamentMember[]
  isOwner?: boolean
  lang?: Lang
}) {
  const T = tx[lang]
  const FORMAT_LABEL: Record<string, string> = {
    round_robin:    T.fmtRoundRobin,
    playoff:        T.fmtPlayoff,
    groups_playoff: T.fmtGroupsPlayoff,
    league_playoff: T.fmtLeaguePlayoff,
  }
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [members, setMembers] = useState<TournamentMember[]>(initialMembers)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(tournament.name)
  const [savingName, setSavingName] = useState(false)

  const [matchPeriods, setMatchPeriods]     = useState(tournament.match_periods ?? 2)
  const [extraTime, setExtraTime]           = useState(tournament.extra_time ?? false)
  const [durationMins, setDurationMins]     = useState(tournament.match_duration_mins ?? 45)
  const [pointsWin, setPointsWin]           = useState(tournament.points_win ?? 3)
  const [pointsDraw, setPointsDraw]         = useState(tournament.points_draw ?? 1)
  const [pointsLoss, setPointsLoss]         = useState(tournament.points_loss ?? 0)
  const [savingSettings, setSavingSettings] = useState(false)

  // Realtime sync for members
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`setup-members-${tournament.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournament_members',
        filter: `tournament_id=eq.${tournament.id}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setMembers(prev => [...prev, payload.new as TournamentMember])
        } else if (payload.eventType === 'UPDATE') {
          setMembers(prev => prev.map(m => m.id === (payload.new as TournamentMember).id ? payload.new as TournamentMember : m))
        } else if (payload.eventType === 'DELETE') {
          setMembers(prev => prev.filter(m => m.id !== (payload.old as TournamentMember).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tournament.id])

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName.trim()) return
    if (teams.some(t => t.name.toLowerCase() === teamName.trim().toLowerCase())) {
      toast.error(T.teamAlreadyExists)
      return
    }
    setLoading(true)
    const result = await addTeam(tournament.id, teamName)
    if (result?.error) toast.error(result.error)
    else setTeamName('')
    setLoading(false)
  }

  async function handleRemoveTeam(teamId: string, teamName: string) {
    if (tournament.generated) {
      const ok = window.confirm(
        `${T.confirmDeleteTeam(teamName)}\n\n${T.deleteTeamScheduleWarning}`
      )
      if (!ok) return
    }
    await removeTeam(teamId, tournament.id)
  }

  async function handleGenerate() {
    if (teams.length < 2) { toast.error(T.minTeamsToGenerate); return }
    setGenerating(true)
    const result = await generateSchedule(tournament.id)
    if (result?.error) toast.error(result.error)
    else toast.success(T.scheduleCreated)
    setGenerating(false)
  }

  async function handleSaveSettings() {
    setSavingSettings(true)
    const result = await updateTournamentSettings(tournament.id, {
      match_periods:       matchPeriods,
      extra_time:          extraTime,
      match_duration_mins: durationMins,
      points_win:          pointsWin,
      points_draw:         pointsDraw,
      points_loss:         pointsLoss,
    })
    setSavingSettings(false)
    if (result?.error) toast.error(result.error)
    else toast.success(T.settingsSaved)
  }

  async function handleSaveName() {
    if (!nameValue.trim() || nameValue.trim() === tournament.name) { setEditingName(false); return }
    setSavingName(true)
    const result = await renameTournament(tournament.id, nameValue)
    if (result?.error) toast.error(result.error)
    else { toast.success(T.nameUpdated); setEditingName(false) }
    setSavingName(false)
  }

  return (
    <>
    <Tabs defaultValue="general" className="max-w-2xl">
      <div className="overflow-x-auto mb-4 -mx-1 px-1 pb-1">
        <TabsList className="flex h-auto gap-1 bg-gray-100 p-1 rounded-xl w-max">
          <TabsTrigger value="general" className={TAB_CLASS}>
            <Settings2 size={12} /> {T.setupTabGeneral}
          </TabsTrigger>
          <TabsTrigger value="rules" className={TAB_CLASS}>
            <Sliders size={12} /> {T.setupTabRules}
          </TabsTrigger>
          <TabsTrigger value="teams" className={TAB_CLASS}>
            <Users size={12} /> {T.setupTabTeams(teams.length)}
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="access" className={TAB_CLASS}>
              <UserCog size={12} /> {T.setupTabAccess}
              {members.length > 0 && (
                <span className="ml-1 bg-emerald-100 text-emerald-700 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                  {members.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      {/* Общее */}
      <TabsContent value="general" className="space-y-4 mt-0">
        {/* Name + logo */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <TournamentLogoUpload
              tournamentId={tournament.id}
              tournamentName={tournament.name}
              logoUrl={tournament.logo_url}
              size={64}
              lang={lang}
            />
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">{T.nameLbl}</p>
                {editingName ? (
                  <div className="flex gap-2">
                    <Input
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      maxLength={40}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                    />
                    <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 px-2" onClick={handleSaveName} disabled={savingName}>
                      {savingName ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { setEditingName(false); setNameValue(tournament.name) }}>
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <button onClick={() => setEditingName(true)} className="flex items-center gap-2 group text-left">
                    <span className="font-bold text-gray-900 text-base">{tournament.name}</span>
                    <Pencil size={13} className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
                  </button>
                )}
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span><span className="font-medium text-gray-700">{T.formatLbl2}</span> {FORMAT_LABEL[tournament.format] ?? tournament.format}</span>
                {tournament.format === 'round_robin' && (
                  <span><span className="font-medium text-gray-700">{T.roundsLbl2}</span> {tournament.num_rounds}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cover */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <LayoutTemplate size={15} className="text-gray-400" />
            <p className="text-sm font-bold text-gray-700">{T.tournamentCoverLbl}</p>
          </div>
          {tournament.cover_url && (
            <div className="rounded-xl overflow-hidden h-28 sm:h-36">
              <TournamentCoverBanner coverUrl={tournament.cover_url} className="h-28 sm:h-36 w-full" />
            </div>
          )}
          <TournamentCoverPicker
            sport={tournament.sport}
            currentCoverUrl={tournament.cover_url}
            tournamentId={tournament.id}
            lang={lang}
          />
          {!tournament.cover_url && (
            <p className="text-xs text-gray-400">{T.coverInHeaderHint}</p>
          )}
        </div>
      </TabsContent>

      {/* Правила */}
      <TabsContent value="rules" className="mt-0">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-5">
          {/* Periods */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{T.periodsLbl2}</p>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                {[1, 2].map(n => (
                  <button
                    key={n}
                    onClick={() => setMatchPeriods(n)}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                      matchPeriods === n ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {n} {T.halfWord(n)}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none ml-4">
                <div
                  onClick={() => setExtraTime(v => !v)}
                  className={`relative rounded-full transition-colors cursor-pointer ${extraTime ? 'bg-emerald-600' : 'bg-gray-200'}`}
                  style={{ width: 40, height: 22 }}
                >
                  <span
                    className="absolute top-0.5 bg-white rounded-full shadow transition-transform"
                    style={{ width: 18, height: 18, left: 2, transform: extraTime ? 'translateX(18px)' : 'translateX(0)' }}
                  />
                </div>
                <span className="text-sm text-gray-600">{T.extraTimeLbl2}</span>
              </label>
            </div>
          </div>

          {/* Duration */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{T.durationLbl2}</p>
            <div className="flex items-center gap-2">
              <Input
                type="number" min={1} max={90}
                value={durationMins}
                onChange={e => setDurationMins(parseInt(e.target.value) || 45)}
                className="w-20 h-8 text-sm text-center font-mono"
              />
              <span className="text-sm text-gray-500">{T.minutesWord}</span>
            </div>
          </div>

          {/* Points */}
          {tournament.format !== 'playoff' && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{T.pointsSystemLbl}</p>
              <div className="flex items-center gap-4">
                {([
                  { key: 'win',  label: T.ptsWinLbl,  value: pointsWin,  setter: setPointsWin },
                  { key: 'draw', label: T.ptsDrawLbl, value: pointsDraw, setter: setPointsDraw },
                  { key: 'loss', label: T.ptsLossLbl, value: pointsLoss, setter: setPointsLoss },
                ] as const).map(({ key, label, value, setter }) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{label}</span>
                    <Input
                      type="number" min={0} max={9}
                      value={value}
                      onChange={e => setter(parseInt(e.target.value) || 0)}
                      className="w-14 h-8 text-center font-mono font-bold text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleSaveSettings} disabled={savingSettings} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            {savingSettings ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Check size={13} className="mr-1.5" />}
            {savingSettings ? T.saving : T.saveSettingsBtn}
          </Button>
        </div>
      </TabsContent>

      {/* Команды */}
      <TabsContent value="teams" className="space-y-4 mt-0">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          <form onSubmit={handleAddTeam} className="flex gap-2">
            <Input
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder={T.teamNamePh}
              maxLength={30}
            />
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 shrink-0" disabled={loading}>
              {loading ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
              {loading ? T.addingBtn : T.addTeamBtn2}
            </Button>
          </form>

          {teams.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-xl">
              {T.addTeamsHint}
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map(team => (
                <div key={team.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                  <TeamLogoUpload
                    teamId={team.id}
                    teamName={team.name}
                    tournamentId={tournament.id}
                    logoUrl={team.logo_url}
                    lang={lang}
                  />
                  <span className="flex-1 font-medium text-sm text-gray-800">{team.name}</span>
                  <button onClick={() => handleRemoveTeam(team.id, team.name)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {tournament.format === 'round_robin' && (
          <Button
            onClick={handleGenerate}
            disabled={teams.length < 2 || generating}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            size="lg"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {generating ? T.generatingBtn : tournament.generated ? T.regenerateScheduleBtn : T.generateScheduleBtn}
          </Button>
        )}
      </TabsContent>

      {/* Доступ */}
      <TabsContent value="access" className="mt-0">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">
              {T.noMembersYet}
            </p>
          ) : (
            <div className="space-y-2">
              {members.map(m => {
                const email = m.invited_email
                const initials = email
                  ? email.slice(0, 2).toUpperCase()
                  : (m.user_id ? m.user_id.slice(0, 2).toUpperCase() : '?')
                const roleLabel = m.role === 'editor' ? T.roleEditor : T.roleViewer
                const roleColor = m.role === 'editor'
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-sky-100 text-sky-700'
                return (
                  <div key={m.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                      m.status === 'accepted' ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {email ?? (m.user_id ? `#${m.user_id.slice(-8)}` : '—')}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${roleColor}`}>
                          {roleLabel}
                        </span>
                        {m.status === 'pending' && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                            <Clock size={10} />
                            {T.pending}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setMembers(prev => prev.filter(x => x.id !== m.id))
                        await removeMember(m.id, tournament.id)
                        toast.success(T.accessRevoked)
                      }}
                      className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                      title={T.revokeAccess}
                    >
                      <UserX size={15} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>

    {/* Danger zone */}
    {isOwner && (
      <DangerZone tournamentId={tournament.id} tournamentName={tournament.name} lang={lang} />
    )}
    </>
  )
}

function DangerZone({ tournamentId, tournamentName, lang = 'ru' }: { tournamentId: string; tournamentName: string; lang?: Lang }) {
  const T = tx[lang]
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <div className="mt-6 border border-red-100 rounded-2xl p-4 bg-red-50/40">
      <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">{T.dangerZoneLbl}</p>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 size={14} />
          {T.deleteTournamentBtn}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-red-700 font-medium">
            {T.deleteTournamentWarning(tournamentName)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {T.cancel}
            </button>
            <form action={deleteTournament.bind(null, tournamentId)} onSubmit={() => setDeleting(true)}>
              <button
                type="submit"
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {deleting ? T.deletingBtn : T.confirmDeleteBtn}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
