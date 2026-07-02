'use client'

import { useState } from 'react'
import { Trophy, Crown, Medal, Share2, Copy, Check, Send, X } from 'lucide-react'
import TeamAvatar from './TeamAvatar'
import { getSportTheme } from '@/lib/sports'
import type { Team } from '@/types'
import { tx, type Lang } from '@/lib/i18n'

export default function ChampionBanner({
  champion,
  runnerUp,
  label,
  tournamentName,
  tournamentId,
  sport,
  lang = 'ru',
}: {
  champion: Team
  runnerUp?: Team | null
  label?: string
  tournamentName?: string
  tournamentId?: string
  sport?: string
  lang?: Lang
}) {
  const T = tx[lang]
  const resolvedLabel = label ?? T.tournamentWinner
  const theme = getSportTheme(sport)
  const [dismissed, setDismissed] = useState(false)
  const [copied, setCopied]       = useState(false)

  if (dismissed) return null

  const shareText = `${champion.name} — ${resolvedLabel.toLowerCase()}${tournamentName ? ` «${tournamentName}»` : ''}`

  // Origin is only known in the browser — resolve the public URL lazily at click time.
  function getShareUrl() {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/t/${tournamentId}`
  }

  async function nativeShare() {
    const url = getShareUrl()
    if (!url) return
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: tournamentName ?? 'Tournable', text: shareText, url }) } catch {}
    } else {
      copyLink()
    }
  }

  async function copyLink() {
    const url = getShareUrl()
    if (!url) return
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  function openTelegram() {
    const url = getShareUrl()
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`, '_blank', 'noopener')
  }
  function openWhatsApp() {
    const url = getShareUrl()
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`, '_blank', 'noopener')
  }

  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-2xl"
      style={{ background: theme.heroDark }}
    >
      {/* Scoped animations */}
      <style>{`
        @keyframes champ-shimmer { 0% { transform: translateX(-120%) skewX(-18deg) } 100% { transform: translateX(320%) skewX(-18deg) } }
        @keyframes champ-rise { 0% { opacity: 0; transform: translateY(10px) } 100% { opacity: 1; transform: translateY(0) } }
        @keyframes champ-glow { 0%,100% { opacity: .35 } 50% { opacity: .7 } }
      `}</style>

      {/* Ambient gold glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle,rgba(251,191,36,.45),transparent 70%)', animation: 'champ-glow 4s ease-in-out infinite' }}
      />
      {/* Fine grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '26px 26px' }}
      />
      {/* Moving shimmer sweep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full w-1/3"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.10),transparent)', animation: 'champ-shimmer 5.5s ease-in-out infinite' }}
        />
      </div>
      {/* Gold top hairline */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(251,191,36,.8),transparent)' }} />

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3.5 right-3.5 z-10 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center transition-colors backdrop-blur-sm"
        aria-label={T.close}
      >
        <X size={14} />
      </button>

      <div className="relative px-6 py-7 sm:px-8 sm:py-8">

        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-2 mb-5" style={{ animation: 'champ-rise .5s ease-out both' }}>
          <span className="h-px w-8 bg-amber-300/40" />
          <Crown size={13} className="text-amber-300" />
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-200">{resolvedLabel}</span>
          <Crown size={13} className="text-amber-300" />
          <span className="h-px w-8 bg-amber-300/40" />
        </div>

        {/* Trophy medallion */}
        <div className="flex justify-center mb-5" style={{ animation: 'champ-rise .6s ease-out both' }}>
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-amber-200/40"
              style={{ background: 'linear-gradient(145deg,#fcd34d,#f59e0b 60%,#d97706)' }}
            >
              <Trophy size={38} className="text-amber-900" />
            </div>
            <span className="absolute inset-0 rounded-2xl ring-2 ring-amber-300/30" style={{ animation: 'champ-glow 3s ease-in-out infinite' }} />
          </div>
        </div>

        {/* Champion */}
        <div className="flex flex-col items-center text-center gap-3" style={{ animation: 'champ-rise .7s ease-out both' }}>
          <div className="flex items-center gap-3 max-w-full">
            <TeamAvatar name={champion.name} logoUrl={champion.logo_url} size={44} />
            <span className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight break-words">
              {champion.name}
            </span>
          </div>

          {tournamentName && (
            <p className="text-sm text-white/70 font-medium">{tournamentName}</p>
          )}

          {/* Runner-up */}
          {runnerUp && (
            <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/8 border border-white/10 px-3.5 py-1.5 backdrop-blur-sm">
              <Medal size={13} className="text-gray-300" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-300">{T.runnerUp}</span>
              <TeamAvatar name={runnerUp.name} logoUrl={runnerUp.logo_url} size={18} />
              <span className="text-sm font-semibold text-white/90">{runnerUp.name}</span>
            </div>
          )}
        </div>

        {/* Share row */}
        {tournamentId && (
          <div className="mt-7 flex flex-col items-center gap-3" style={{ animation: 'champ-rise .8s ease-out both' }}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">
              {T.shareAchievement}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={nativeShare}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-sm font-black transition-colors shadow-md"
              >
                <Share2 size={15} /> {T.share}
              </button>
              <button
                onClick={openTelegram}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 flex items-center justify-center transition-colors backdrop-blur-sm"
                title="Telegram"
              >
                <Send size={16} />
              </button>
              <button
                onClick={openWhatsApp}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 flex items-center justify-center transition-colors backdrop-blur-sm font-black text-xs"
                title="WhatsApp"
              >
                WA
              </button>
              <button
                onClick={copyLink}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 flex items-center justify-center transition-colors backdrop-blur-sm"
                title={T.shareCopyLink}
              >
                {copied ? <Check size={16} className="text-amber-300" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Season CTA */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center" style={{ animation: 'champ-rise .9s ease-out both' }}>
          <p className="text-xs text-white/50 mb-2.5">{T.saveHistoryCta}</p>
          <a
            href="/pricing#enterprise"
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-bold transition-colors backdrop-blur-sm border border-white/10"
          >
            {T.createLeagueCta}
          </a>
        </div>
      </div>
    </div>
  )
}
