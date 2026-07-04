'use client'

import { useEffect, useState } from 'react'
import { X, Copy, Check, ExternalLink, Globe, Link2, Mail, Trash2, UserPlus, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { APP_URL } from '@/lib/appUrl'
import {
  createLeagueInviteLink, inviteLeagueByEmail, removeLeagueMember, getLeagueMembers, type LeagueMemberRow,
} from '@/app/actions/leagueMembers'

type Lang = 'ru' | 'kz' | 'en'

const T = {
  ru: {
    title: 'Поделиться', publicPage: 'Публичная страница', publicHint: 'Любой может смотреть таблицу, матчи, команды и статистику — без регистрации.',
    copy: 'Копировать', copied: 'Скопировано', open: 'Открыть',
    coEditors: 'Со-редакторы и доступ', editor: 'Редактор', viewer: 'Наблюдатель',
    inviteLink: 'Ссылка-приглашение', genLink: 'Создать ссылку', emailPh: 'email@пример.com', sendInvite: 'Пригласить',
    members: 'Участники', noMembers: 'Пока никого', pending: 'ожидает', accepted: 'принято',
    linkReady: 'Ссылка готова — скопируйте и отправьте', invited: 'Приглашение отправлено',
  },
  kz: {
    title: 'Бөлісу', publicPage: 'Ашық бет', publicHint: 'Кез келген адам кестені, матчтарды, командаларды және статистиканы тіркелусіз көре алады.',
    copy: 'Көшіру', copied: 'Көшірілді', open: 'Ашу',
    coEditors: 'Со-редакторлар және қолжетімділік', editor: 'Редактор', viewer: 'Бақылаушы',
    inviteLink: 'Шақыру сілтемесі', genLink: 'Сілтеме жасау', emailPh: 'email@мысал.com', sendInvite: 'Шақыру',
    members: 'Қатысушылар', noMembers: 'Әзірге ешкім жоқ', pending: 'күтуде', accepted: 'қабылданды',
    linkReady: 'Сілтеме дайын — көшіріп жіберіңіз', invited: 'Шақыру жіберілді',
  },
  en: {
    title: 'Share', publicPage: 'Public page', publicHint: 'Anyone can view the table, matches, teams and stats — no sign-up.',
    copy: 'Copy', copied: 'Copied', open: 'Open',
    coEditors: 'Co-editors & access', editor: 'Editor', viewer: 'Viewer',
    inviteLink: 'Invite link', genLink: 'Create link', emailPh: 'email@example.com', sendInvite: 'Invite',
    members: 'Members', noMembers: 'No one yet', pending: 'pending', accepted: 'accepted',
    linkReady: 'Link ready — copy and send it', invited: 'Invitation sent',
  },
} as const

export default function ChampionshipShare({ leagueId, slug, name, brand = '#7c3aed', lang = 'ru', isOwner = false, initialMembers = [], onClose }: {
  leagueId: string
  slug: string
  name: string
  brand?: string
  lang?: Lang
  isOwner?: boolean
  initialMembers?: LeagueMemberRow[]
  onClose: () => void
}) {
  const tx = T[lang]
  const publicUrl = `${APP_URL}/leagues/${slug}`
  const shareText = lang === 'en' ? `Follow "${name}" on Tournable` : `Следите за «${name}» на Tournable`

  const [copied, setCopied] = useState(false)
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [inviteUrl, setInviteUrl] = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [members, setMembers] = useState<LeagueMemberRow[]>(initialMembers)

  useEffect(() => {
    if (!isOwner) return
    getLeagueMembers(leagueId).then(setMembers).catch(() => {})
  }, [isOwner, leagueId])

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  async function genLink() {
    setGenLoading(true)
    const res = await createLeagueInviteLink(leagueId, role)
    setGenLoading(false)
    if (res.error) { toast.error(res.error); return }
    if (res.token) { setInviteUrl(`${APP_URL}/invite/league/${res.token}`); toast.success(tx.linkReady) }
  }

  async function sendEmail() {
    if (!email.trim()) return
    setEmailLoading(true)
    const res = await inviteLeagueByEmail(leagueId, role, email.trim(), lang)
    setEmailLoading(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(tx.invited); setEmail('')
    setMembers(prev => [...prev, { id: `tmp-${Date.now()}`, role, status: 'pending', invited_email: email.trim(), user_id: null }])
  }

  async function remove(id: string) {
    setMembers(prev => prev.filter(m => m.id !== id))
    await removeLeagueMember(id, leagueId)
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-gray-900/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-black text-gray-900">{tx.title}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Public page */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe size={15} style={{ color: brand }} />
              <p className="text-sm font-black text-gray-900">{tx.publicPage}</p>
            </div>
            <p className="text-xs text-gray-400 mb-2.5">{tx.publicHint}</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              <span className="flex-1 text-xs text-gray-600 truncate">{publicUrl}</span>
              <button onClick={() => copy(publicUrl)} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500" title={tx.copy}>
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
              <a href={publicUrl} target="_blank" className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500" title={tx.open}>
                <ExternalLink size={14} />
              </a>
            </div>
            <div className="flex gap-2 mt-2.5">
              <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${publicUrl}`)}`} target="_blank"
                className="flex-1 text-center text-xs font-bold text-white py-2 rounded-lg" style={{ background: '#25D366' }}>WhatsApp</a>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(shareText)}`} target="_blank"
                className="flex-1 text-center text-xs font-bold text-white py-2 rounded-lg" style={{ background: '#229ED9' }}>Telegram</a>
              <button onClick={() => copy(`${shareText} ${publicUrl}`)}
                className="flex-1 text-xs font-bold text-gray-600 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">{tx.copy}</button>
            </div>
          </div>

          {/* Co-editors */}
          {isOwner && (
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus size={15} style={{ color: brand }} />
                <p className="text-sm font-black text-gray-900">{tx.coEditors}</p>
              </div>

              <div className="flex gap-1.5 mb-3">
                {(['editor', 'viewer'] as const).map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${role === r ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
                    style={role === r ? { background: brand } : undefined}>
                    {r === 'editor' ? tx.editor : tx.viewer}
                  </button>
                ))}
              </div>

              {/* Invite link */}
              <button onClick={genLink} disabled={genLoading}
                className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-bold py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 mb-2">
                {genLoading ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />} {tx.genLink}
              </button>
              {inviteUrl && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 mb-3">
                  <span className="flex-1 text-xs text-gray-600 truncate">{inviteUrl}</span>
                  <button onClick={() => copy(inviteUrl)} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"><Copy size={14} /></button>
                </div>
              )}

              {/* Invite by email */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2.5">
                  <Mail size={14} className="text-gray-400 shrink-0" />
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder={tx.emailPh} type="email"
                    className="flex-1 py-2 outline-none text-sm bg-transparent" />
                </div>
                <button onClick={sendEmail} disabled={emailLoading || !email.trim()}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-white px-3 rounded-lg disabled:opacity-50" style={{ background: brand }}>
                  {emailLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>

              {/* Members list */}
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-300 mb-2">{tx.members}</p>
              {members.length === 0 ? (
                <p className="text-xs text-gray-400">{tx.noMembers}</p>
              ) : (
                <div className="space-y-1.5">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{m.invited_email ?? '—'}</p>
                        <p className="text-[11px] text-gray-400">{m.role === 'editor' ? tx.editor : tx.viewer} · {m.status === 'accepted' ? tx.accepted : tx.pending}</p>
                      </div>
                      <button onClick={() => remove(m.id)} className="text-gray-300 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
