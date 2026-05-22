'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Check, ArrowRight, MessageCircle, Phone, Trophy, Zap, BarChart3, Share2, Download, Users, ChevronRight } from 'lucide-react'

// ─── Social Icons (SVG, not in Lucide) ────────────────────────────────────────

function IconTelegram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
    </svg>
  )
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
}

function IconTikTok({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.84 4.84 0 01-1.01-.07z"/>
    </svg>
  )
}

// ─── Device Frames ────────────────────────────────────────────────────────────

function MacbookFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="select-none">
      {/* Screen assembly */}
      <div style={{
        background: 'linear-gradient(160deg, #1c1c1e 0%, #111 100%)',
        borderRadius: '12px 12px 0 0',
        padding: '10px 10px 0',
        boxShadow: '0 -4px 40px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.06)',
      }}>
        {/* FaceTime camera */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2a2a2e', border: '1px solid #333' }} />
        </div>
        {/* Browser chrome */}
        <div style={{
          background: '#252528',
          borderRadius: '6px 6px 0 0',
          padding: '7px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFBD2E' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28C940' }} />
          </div>
          <div style={{ flex: 1, background: '#3a3a3d', borderRadius: '5px', padding: '3px 10px', fontSize: '10px', color: '#888', textAlign: 'center', letterSpacing: '.01em' }}>
            tournable-app.vercel.app
          </div>
        </div>
        {/* Screen content */}
        <div style={{ background: '#fff', overflow: 'hidden', borderRadius: '0 0 2px 2px', aspectRatio: '16/10' }}>
          {children}
        </div>
      </div>
      {/* Hinge */}
      <div style={{
        background: 'linear-gradient(180deg, #b8b8bc 0%, #9a9a9e 60%, #b8b8bc 100%)',
        height: '16px',
        borderRadius: '0 0 2px 2px',
        boxShadow: '0 6px 24px rgba(0,0,0,.35), inset 0 -1px 0 rgba(0,0,0,.2)',
      }} />
      {/* Base */}
      <div style={{
        background: 'linear-gradient(180deg, #c8c8cc 0%, #b0b0b4 100%)',
        height: '4px',
        borderRadius: '0 0 10px 10px',
        margin: '0 30px',
        boxShadow: '0 10px 30px rgba(0,0,0,.3)',
      }} />
    </div>
  )
}

function IPhoneFrame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="select-none mx-auto" style={{ width: '240px' }}>
      <div style={{
        background: dark ? 'linear-gradient(160deg, #2a2a2e, #1a1a1c)' : 'linear-gradient(160deg, #1c1c1e, #111)',
        borderRadius: '46px',
        padding: '14px',
        boxShadow: '0 0 0 1px rgba(255,255,255,.08), 0 30px 80px rgba(0,0,0,.6), 0 8px 20px rgba(0,0,0,.4)',
        position: 'relative',
      }}>
        {/* Power button */}
        <div style={{ position: 'absolute', right: '-3px', top: '100px', width: '3px', height: '36px', background: '#333', borderRadius: '0 2px 2px 0' }} />
        {/* Volume buttons */}
        <div style={{ position: 'absolute', left: '-3px', top: '70px', width: '3px', height: '28px', background: '#333', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: '-3px', top: '110px', width: '3px', height: '28px', background: '#333', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: '-3px', top: '150px', width: '3px', height: '28px', background: '#333', borderRadius: '2px 0 0 2px' }} />
        {/* Screen */}
        <div style={{ background: dark ? '#0a0a0a' : '#fff', borderRadius: '34px', overflow: 'hidden', position: 'relative', minHeight: '460px' }}>
          {/* Dynamic Island */}
          <div style={{
            position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
            width: '88px', height: '28px', background: '#000', borderRadius: '20px', zIndex: 20,
          }} />
          <div style={{ paddingTop: '48px' }}>
            {children}
          </div>
        </div>
        {/* Home bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '2px' }}>
          <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,.25)', borderRadius: '4px' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Team + Tournament logo components ───────────────────────────────────────

const TEAMS: Record<string, { color: string; bg: string; abbr: string; name: string }> = {
  almaty:  { color: '#059669', bg: 'linear-gradient(135deg,#059669,#047857)', abbr: 'ФА', name: 'FC Алматы' },
  astana:  { color: '#1d4ed8', bg: 'linear-gradient(135deg,#1d4ed8,#1e40af)', abbr: 'АС', name: 'Астана' },
  kairat:  { color: '#dc2626', bg: 'linear-gradient(135deg,#dc2626,#b91c1c)', abbr: 'КА', name: 'Кайрат' },
  tobol:   { color: '#ea580c', bg: 'linear-gradient(135deg,#ea580c,#c2410c)', abbr: 'ТО', name: 'Тобол' },
  ordabasy:{ color: '#7c3aed', bg: 'linear-gradient(135deg,#7c3aed,#6d28d9)', abbr: 'ОР', name: 'Ордабасы' },
}

function TeamLogo({ id, size = 28 }: { id: keyof typeof TEAMS; size?: number }) {
  const t = TEAMS[id]
  const r = size / 2
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: t.bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 900, fontSize: size * 0.32,
      boxShadow: `0 2px 8px ${t.color}50, 0 0 0 1.5px rgba(255,255,255,.15)`,
    }}>
      {t.abbr}
    </div>
  )
}

function TournamentBadge({ color, abbr, size = 36 }: { color: string; abbr: string; size?: number }) {
  return (
    <svg viewBox="0 0 36 42" width={size} height={size * 1.16} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={`g${abbr}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".9"/>
          <stop offset="100%" stopColor={color} stopOpacity="1"/>
        </linearGradient>
      </defs>
      <path d="M18 1L2 7v14c0 10 7 18 16 20 9-2 16-10 16-20V7L18 1z" fill={`url(#g${abbr})`}/>
      <path d="M18 1L2 7v14c0 10 7 18 16 20 9-2 16-10 16-20V7L18 1z" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1"/>
      <text x="18" y="25" textAnchor="middle" fill="white" fontSize="10" fontWeight="900" fontFamily="Inter,sans-serif">{abbr}</text>
    </svg>
  )
}

// ─── Screen content components ────────────────────────────────────────────────

function ScreenDashboard() {
  const tournaments = [
    { abbr: 'ЛК', color: '#059669', name: 'Летний Кубок 2025', teams: 8, fmt: 'Круговой', active: true },
    { abbr: 'КР', color: '#7c3aed', name: 'Кубок района',      teams: 12, fmt: 'Плей-офф', active: true },
    { abbr: 'ЧО', color: '#1d4ed8', name: 'Чемпионат офиса',   teams: 6, fmt: 'Круговой', active: false },
  ]
  return (
    <div style={{ background: '#f9fafb', height: '100%', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#059669,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 11 }}>Т</div>
          <span style={{ fontWeight: 900, fontSize: 12, color: '#065f46', letterSpacing: '-.01em' }}>TOURNABLE</span>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#065f46', fontWeight: 700, fontSize: 10 }}>А</div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: '#111' }}>Мои турниры</span>
          <div style={{ background: '#059669', color: '#fff', fontSize: 9, fontWeight: 700, padding: '5px 10px', borderRadius: 8 }}>+ Создать</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tournaments.map(t => (
            <div key={t.name} style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <TournamentBadge color={t.color} abbr={t.abbr} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#111', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                <div style={{ fontSize: 9, color: '#9ca3af' }}>{t.teams} команд · {t.fmt}</div>
              </div>
              <span style={{ fontSize: 8, fontWeight: 700, padding: '3px 7px', borderRadius: 20, background: t.active ? '#d1fae5' : '#f3f4f6', color: t.active ? '#065f46' : '#6b7280', flexShrink: 0 }}>
                {t.active ? 'Активен' : 'Завершён'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScreenStandings() {
  const rows = [
    { id: 'almaty',   p: 8, w: 6, d: 1, l: 1, gf: 18, ga: 7,  pts: 19, form: ['W','W','W','D','W'] },
    { id: 'astana',   p: 8, w: 5, d: 2, l: 1, gf: 14, ga: 8,  pts: 17, form: ['W','D','W','W','D'] },
    { id: 'kairat',   p: 8, w: 3, d: 1, l: 4, gf: 11, ga: 14, pts: 10, form: ['L','W','L','W','L'] },
    { id: 'ordabasy', p: 7, w: 2, d: 2, l: 3, gf: 9,  ga: 11, pts: 8,  form: ['D','L','W','D','L'] },
    { id: 'tobol',    p: 7, w: 1, d: 0, l: 6, gf: 5,  ga: 17, pts: 3,  form: ['L','L','L','W','L'] },
  ] as const
  const formBg: Record<string, string> = { W: '#059669', D: '#f59e0b', L: '#ef4444' }
  const formLbl: Record<string, string> = { W: 'В', D: 'Н', L: 'П' }
  return (
    <div style={{ fontFamily: 'Inter,sans-serif', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* App header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <TournamentBadge color="#059669" abbr="ЛК" size={26} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 11, color: '#111' }}>Летний Кубок 2025</div>
          <div style={{ fontSize: 8, color: '#059669', fontWeight: 600 }}>Круговой · 2 круга</div>
        </div>
      </div>
      {/* Tabs */}
      <div style={{ display: 'flex', background: '#f9fafb', borderBottom: '1px solid #f0f0f0', padding: '4px 6px', gap: 2, overflowX: 'auto' }}>
        {['Настройка','Матчи','Таблица','Плей-офф','Статистика'].map((tab, i) => (
          <div key={tab} style={{ padding: '4px 8px', fontSize: 8, fontWeight: 700, borderRadius: 6, whiteSpace: 'nowrap', background: i === 2 ? '#059669' : 'transparent', color: i === 2 ? '#fff' : '#9ca3af' }}>{tab}</div>
        ))}
      </div>
      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '18px 1fr 20px 20px 20px 20px 44px 22px', gap: '0 4px', padding: '6px 10px', background: '#f0fdf4', fontSize: 7, fontWeight: 700, color: '#065f46' }}>
        <span style={{ textAlign: 'center' }}>#</span>
        <span>Команда</span>
        <span style={{ textAlign: 'center' }}>И</span>
        <span style={{ textAlign: 'center' }}>В</span>
        <span style={{ textAlign: 'center' }}>Н</span>
        <span style={{ textAlign: 'center' }}>П</span>
        <span style={{ textAlign: 'center' }}>Форма</span>
        <span style={{ textAlign: 'center', fontWeight: 900 }}>О</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '18px 1fr 20px 20px 20px 20px 44px 22px', gap: '0 4px', padding: '6px 10px', alignItems: 'center', background: i === 0 ? '#f0fdf4' : i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f5f5f5' }}>
          <span style={{ textAlign: 'center', fontSize: 7, color: '#9ca3af', fontWeight: 600 }}>{i + 1}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <TeamLogo id={r.id as keyof typeof TEAMS} size={16} />
            <span style={{ fontSize: 8, fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{TEAMS[r.id as keyof typeof TEAMS].name}</span>
          </div>
          <span style={{ textAlign: 'center', fontSize: 7, color: '#6b7280' }}>{r.p}</span>
          <span style={{ textAlign: 'center', fontSize: 7, color: '#059669', fontWeight: 600 }}>{r.w}</span>
          <span style={{ textAlign: 'center', fontSize: 7, color: '#6b7280' }}>{r.d}</span>
          <span style={{ textAlign: 'center', fontSize: 7, color: '#ef4444' }}>{r.l}</span>
          <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            {r.form.map((f, j) => (
              <div key={j} style={{ width: 8, height: 8, borderRadius: 2, background: formBg[f], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 5, fontWeight: 900 }}>{formLbl[f]}</div>
            ))}
          </div>
          <span style={{ textAlign: 'center', fontSize: 9, fontWeight: 900, color: i === 0 ? '#059669' : '#111' }}>{r.pts}</span>
        </div>
      ))}
    </div>
  )
}

function ScreenLive() {
  return (
    <div style={{ background: '#030712', minHeight: '100%', fontFamily: 'Inter,sans-serif', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 20, padding: '4px 10px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
          <span style={{ fontSize: 8, fontWeight: 700, color: '#f87171', letterSpacing: '.08em' }}>LIVE</span>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '10px 16px 0' }}>
        <div style={{ fontSize: 8, color: '#6b7280', fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.06em' }}>Тур 3 · Матч 2</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <TeamLogo id="kairat" size={44} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#e5e7eb', marginTop: 6, lineHeight: 1.2 }}>Кайрат</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>
              2<span style={{ color: '#374151', margin: '0 4px' }}>:</span>1
            </div>
            <div style={{ fontSize: 11, color: '#34d399', fontFamily: 'monospace', fontWeight: 700, marginTop: 4 }}>43:17 ●</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <TeamLogo id="astana" size={44} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#e5e7eb', marginTop: 6, lineHeight: 1.2 }}>Астана</div>
          </div>
        </div>
      </div>
      <div style={{ margin: '14px 12px 0', background: '#0f172a', borderRadius: 16, padding: '10px 12px' }}>
        <div style={{ fontSize: 8, color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>События матча</div>
        {[
          { icon: '⚽', min: "12'", name: 'А. Исмаилов', team: 'kairat' as const },
          { icon: '⚽', min: "31'", name: 'Б. Джаксыбеков', team: 'kairat' as const },
          { icon: '⚽', min: "38'", name: 'Е. Нурланов', team: 'astana' as const },
          { icon: '🟨', min: "41'", name: 'М. Сейткали', team: 'kairat' as const },
        ].map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < 3 ? '1px solid #1e293b' : 'none' }}>
            <span style={{ fontSize: 10 }}>{e.icon}</span>
            <span style={{ fontSize: 8, color: '#6b7280', fontFamily: 'monospace', width: 20, flexShrink: 0 }}>{e.min}</span>
            <TeamLogo id={e.team} size={14} />
            <span style={{ fontSize: 9, fontWeight: 600, color: '#d1d5db', flex: 1 }}>{e.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScreenPlayoff() {
  return (
    <div style={{ fontFamily: 'Inter,sans-serif', height: '100%', background: '#fff' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <TournamentBadge color="#7c3aed" abbr="КР" size={26} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 11, color: '#111' }}>Кубок района</div>
          <div style={{ fontSize: 8, color: '#7c3aed', fontWeight: 600 }}>Плей-офф · 12 команд</div>
        </div>
      </div>
      <div style={{ display: 'flex', background: '#f9fafb', borderBottom: '1px solid #f0f0f0', padding: '4px 6px', gap: 2 }}>
        {['Матчи','Таблица','Плей-офф','Стат.'].map((tab, i) => (
          <div key={tab} style={{ padding: '4px 8px', fontSize: 8, fontWeight: 700, borderRadius: 6, background: i === 2 ? '#7c3aed' : 'transparent', color: i === 2 ? '#fff' : '#9ca3af' }}>{tab}</div>
        ))}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 8, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'center', marginBottom: 10 }}>1/2 финала</div>
        {[
          { home: 'almaty', away: 'tobol', hs: 3, as_: 1, done: true },
          { home: 'astana', away: 'kairat', hs: 2, as_: 0, done: true },
        ].map((m, i) => (
          <div key={i} style={{ background: '#fafafa', borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0', marginBottom: 8 }}>
            {[
              { id: m.home as keyof typeof TEAMS, score: m.hs, winner: m.hs > m.as_ },
              { id: m.away as keyof typeof TEAMS, score: m.as_, winner: m.as_ > m.hs },
            ].map((side, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 8, borderBottom: j === 0 ? '1px solid #f0f0f0' : 'none', background: side.winner ? '#f0fdf4' : '#fff' }}>
                <TeamLogo id={side.id} size={18} />
                <span style={{ flex: 1, fontSize: 10, fontWeight: side.winner ? 700 : 500, color: side.winner ? '#111' : '#6b7280' }}>{TEAMS[side.id].name}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: side.winner ? '#059669' : '#9ca3af' }}>{side.score}</span>
              </div>
            ))}
          </div>
        ))}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 8, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'center', marginBottom: 8 }}>Финал</div>
          <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius: 14, border: '1.5px solid #bbf7d0', padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <TeamLogo id="almaty" size={28} />
                <div style={{ fontSize: 9, fontWeight: 700, color: '#065f46', marginTop: 4 }}>FC Алматы</div>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700 }}>vs</div>
              <div style={{ textAlign: 'center' }}>
                <TeamLogo id="astana" size={28} />
                <div style={{ fontSize: 9, fontWeight: 600, color: '#374151', marginTop: 4 }}>Астана</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

// Monthly: 4990₸ | Annual: 4990*12*0.7 = 41916₸ → 3493₸/мес
const MONTHLY = 4990
const ANNUAL_TOTAL = Math.round(MONTHLY * 12 * 0.7)         // 41916
const ANNUAL_MONTHLY = Math.round(ANNUAL_TOTAL / 12)        // 3493
const ANNUAL_SAVING = MONTHLY * 12 - ANNUAL_TOTAL           // 17964

// ─── Main component ───────────────────────────────────────────────────────────

export function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'Inter,sans-serif' }}>

      {/* ── Topbar ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.png" alt="Tournable" width={36} height={36} className="w-9 h-9 object-contain" />
            <span className="font-black text-[17px] tracking-tight text-gray-900" style={{ letterSpacing: '-.02em' }}>
              TOURNABLE
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {[['#features','Возможности'],['#pricing','Тарифы'],['#contact','Контакты']].map(([href, label]) => (
              <a key={href} href={href} className="px-3.5 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all font-medium">
                {label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link href="/dashboard" className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Мои турниры <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-2 transition-colors">
                  Войти
                </Link>
                <Link href="/register" className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
                  Начать бесплатно <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Dot grid bg */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: .6 }} />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/60 to-white pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-7 border border-emerald-100/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Платформа для организаторов турниров
              </div>
              <h1 className="text-[2.75rem] sm:text-[3.25rem] font-black leading-[1.06] tracking-tight text-gray-900 mb-5" style={{ letterSpacing: '-.03em' }}>
                Турниры —<br/>
                просто.<br/>
                <span className="text-emerald-600">Профессионально.</span>
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-9 max-w-md">
                Автоматическое расписание, счёт в реальном времени, статистика и публичные ссылки — всё что нужно организатору, без Excel и мессенджеров.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/register" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-200">
                  Начать бесплатно
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#features" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-medium text-sm px-4 py-3.5 transition-colors">
                  Смотреть возможности <ChevronRight className="w-4 h-4" />
                </a>
              </div>
              {/* Mini proof */}
              <div className="flex items-center gap-4 mt-10 pt-8 border-t border-gray-100">
                {[['Бесплатный план','навсегда'],['Готов за','30 секунд'],['Без карты','при регистрации']].map(([top, bot]) => (
                  <div key={top}>
                    <div className="font-bold text-sm text-gray-900">{top}</div>
                    <div className="text-xs text-gray-400">{bot}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Laptop mockup */}
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-br from-emerald-50/80 to-transparent rounded-[40px] -z-10" />
              <MacbookFrame>
                <ScreenStandings />
              </MacbookFrame>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live section — dark ── */}
      <section className="bg-[#030712] py-24 lg:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                Онлайн-табло
              </div>
              <h2 className="text-[2.25rem] sm:text-[2.75rem] font-black text-white leading-[1.08] tracking-tight mb-5" style={{ letterSpacing: '-.03em' }}>
                Счёт — у всех<br/>
                <span className="text-emerald-400">в реальном времени</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Ведите матч прямо с телефона. Участники видят голы и карточки мгновенно по публичной ссылке — без установки приложения и без регистрации.
              </p>
              <ul className="space-y-4">
                {[
                  ['Таймер матча','с накопленным временем и паузой'],
                  ['Голы и ассисты','с привязкой к конкретному игроку'],
                  ['Жёлтые и красные карточки','в ленте событий'],
                  ['Публичный URL','— делитесь одним кликом'],
                ].map(([title, desc]) => (
                  <li key={title} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">{title}</span>
                      <span className="text-sm text-gray-500"> — {desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Phone */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute -inset-10 rounded-full" style={{ background: 'radial-gradient(circle, rgba(5,150,105,.12) 0%, transparent 70%)' }} />
                <IPhoneFrame dark>
                  <ScreenLive />
                </IPhoneFrame>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Playoff / Mobile section ── */}
      <section className="bg-gray-50 py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Phone */}
            <div className="flex justify-center lg:justify-start order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -inset-8 bg-purple-50 rounded-3xl -z-10" />
                <IPhoneFrame>
                  <ScreenPlayoff />
                </IPhoneFrame>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="text-2xl">🏆</div>
                    <div>
                      <div className="text-[11px] font-black text-gray-800 leading-tight">Финалист определён</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">FC Алматы → Финал</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="order-1 lg:order-2">
              <h2 className="text-[2.25rem] sm:text-[2.75rem] font-black tracking-tight leading-[1.08] mb-5" style={{ letterSpacing: '-.03em' }}>
                Плей-офф сетка<br/>
                <span className="text-purple-600">обновляется сама</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Победители автоматически переходят в следующий раунд. Никакого ручного ввода — введи результат, и сетка перестраивается мгновенно.
              </p>
              <ul className="space-y-4">
                {[
                  'Сетка 1/8, 1/4, 1/2 финала и финал',
                  'Авто-переход победителей в следующий раунд',
                  'Работает вместе с групповым этапом',
                  'Красивый вид для показа на экране',
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-purple-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section id="features" className="py-24 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-[2rem] sm:text-[2.5rem] font-black tracking-tight mb-4" style={{ letterSpacing: '-.03em' }}>
              Всё что нужно организатору
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Один инструмент вместо таблиц, мессенджеров и ручных подсчётов
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Zap,       color: 'bg-emerald-50 text-emerald-600', title: 'Расписание за 30 секунд', desc: 'Выберите формат, добавьте команды — расписание сгенерируется автоматически. Поддерживаем круговой, плей-офф и Лигу чемпионов.' },
              { icon: BarChart3, color: 'bg-blue-50 text-blue-600',       title: 'Таблица и статистика', desc: 'Очки, разница мячей, бомбардиры, ассистенты — всё пересчитывается автоматически после каждого матча.' },
              { icon: Trophy,    color: 'bg-purple-50 text-purple-600',   title: 'Плей-офф сетка', desc: 'Сетка на выбывание с автоматическим переходом победителей. Поддержка до 64 команд в одном турнире.' },
              { icon: Share2,    color: 'bg-orange-50 text-orange-600',   title: 'Публичная ссылка', desc: 'Участники и болельщики смотрят результаты без регистрации. Поделитесь одной ссылкой — она работает всегда.' },
              { icon: Users,     color: 'bg-pink-50 text-pink-600',       title: 'Совместная работа', desc: 'Пригласите помощников по ссылке. До 3 соредакторов могут вводить результаты параллельно.' },
              { icon: Download,  color: 'bg-gray-100 text-gray-700',      title: 'Экспорт PDF и PNG', desc: 'Скачайте турнирную таблицу, статистику или сетку плей-офф одним кликом — для печати или соцсетей.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-gray-50 py-24 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-4">
            <h2 className="text-[2rem] sm:text-[2.5rem] font-black tracking-tight mb-4" style={{ letterSpacing: '-.03em' }}>
              Начните бесплатно.<br/>Обновитесь когда будете готовы.
            </h2>
            <p className="text-gray-400 text-lg">Без скрытых платежей. Отмена в один клик.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto mt-12 items-stretch">

            {/* Free */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Старт</div>
              <div className="mb-2">
                <span className="text-5xl font-black text-gray-900">Бесплатно</span>
              </div>
              <p className="text-sm text-gray-400 mb-8">Всё необходимое, чтобы начать</p>
              <ul className="space-y-3 mb-10 flex-1">
                {[
                  'До 3 турниров за всё время',
                  'До 16 команд в каждом',
                  'Круговой и плей-офф форматы',
                  'Публичная ссылка для участников',
                  'Статистика: голы, ассисты, карточки',
                  'Логотипы команд и турниров',
                  'Экспорт PDF и PNG',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors">
                Создать турнир
              </Link>
            </div>

            {/* Pro */}
            <div className="relative bg-emerald-600 rounded-2xl p-8 flex flex-col text-white shadow-2xl shadow-emerald-200">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-emerald-900 text-emerald-200 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                  Самый популярный
                </span>
              </div>
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-3">Про</div>
              <div className="mb-1">
                <span className="text-5xl font-black">{ANNUAL_MONTHLY.toLocaleString('ru')}</span>
                <span className="text-2xl font-bold text-emerald-300 ml-1">₸</span>
                <span className="text-sm text-emerald-300 ml-1">/мес</span>
              </div>
              <div className="text-sm text-emerald-200 mb-1">при оплате {ANNUAL_TOTAL.toLocaleString('ru')} ₸/год</div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-700/50 rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-200 mb-2 self-start">
                Экономия {ANNUAL_SAVING.toLocaleString('ru')} ₸/год
              </div>
              <p className="text-sm text-emerald-200 mb-8">или {MONTHLY.toLocaleString('ru')} ₸/мес без годовой подписки</p>
              <ul className="space-y-3 mb-10 flex-1">
                {[
                  'Бесконечные турниры',
                  'До 64 команд в каждом',
                  'Онлайн-табло в реальном времени',
                  'До 3 соредакторов',
                  'Все форматы: Лига чемпионов, Чемпионат мира, кастомные',
                  'Приоритетная поддержка',
                  'Всё из бесплатного плана',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
                    <span className="text-emerald-50">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=pro" className="block text-center bg-white text-emerald-700 hover:bg-emerald-50 font-bold py-3 rounded-xl transition-colors">
                Попробовать Про
              </Link>
            </div>
          </div>

          {/* Need more */}
          <div className="text-center mt-10">
            <p className="text-sm text-gray-400">
              Нужно больше команд или турниров?{' '}
              <a href="#contact" className="text-emerald-600 font-semibold hover:underline">Свяжитесь с нами</a> — найдём решение.
            </p>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-24 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-[2rem] sm:text-[2.5rem] font-black tracking-tight mb-4" style={{ letterSpacing: '-.03em' }}>
            Остались вопросы?
          </h2>
          <p className="text-gray-400 text-lg mb-12">
            Напишите напрямую — отвечаем быстро
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://wa.me/message/YHLE2IFII4MSJ1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg hover:scale-[1.02]"
              style={{ background: '#25D366', color: '#fff', boxShadow: '0 8px 30px rgba(37,211,102,.3)' }}
            >
              <MessageCircle className="w-5 h-5" />
              Написать в WhatsApp
            </a>
            <a
              href="tel:+77064092021"
              className="flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all hover:scale-[1.02]"
            >
              <Phone className="w-5 h-5" />
              +7 (706) 409-20-21
            </a>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#047857 0%,#059669 50%,#10b981 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h2 className="text-[2rem] sm:text-[2.5rem] font-black text-white mb-4 tracking-tight" style={{ letterSpacing: '-.03em' }}>
            Готовы к первому турниру?
          </h2>
          <p className="text-emerald-100 text-lg mb-10">
            Регистрация занимает меньше минуты. Кредитная карта не нужна.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-10 py-4 rounded-2xl transition-colors text-base shadow-xl">
            Начать бесплатно
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <Image src="/logo.png" alt="Tournable" width={36} height={36} className="w-9 h-9 object-contain" />
                <span className="font-black text-white text-lg tracking-tight">TOURNABLE</span>
              </Link>
              <p className="text-sm leading-relaxed text-gray-500 mb-6">
                Платформа для организаторов турниров. Просто, быстро, профессионально.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://instagram.com/tournable_app" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <IconInstagram className="w-4 h-4 text-gray-400 hover:text-white" />
                </a>
                <a href="https://tiktok.com/@tournable" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <IconTikTok className="w-4 h-4 text-gray-400 hover:text-white" />
                </a>
                <a href="https://t.me/tournable" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <IconTelegram className="w-4 h-4 text-gray-400 hover:text-white" />
                </a>
                <a href="mailto:hello@tournable.app"
                  className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Продукт</h4>
              <ul className="space-y-3">
                {[['#features','Возможности'],['#pricing','Тарифы'],['#contact','Контакты'],].map(([href, label]) => (
                  <li key={href}>
                    <a href={href} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Платформа</h4>
              <ul className="space-y-3">
                {[['/login','Войти'],['/register','Регистрация'],['/register?plan=pro','Тариф Про']].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Связь</h4>
              <ul className="space-y-3">
                <li>
                  <a href="https://wa.me/message/YHLE2IFII4MSJ1" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </li>
                <li>
                  <a href="tel:+77064092021" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> +7 (706) 409-20-21
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@tournable.app" className="text-sm text-gray-500 hover:text-white transition-colors">
                    hello@tournable.app
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">© 2026 Tournable. Все права защищены.</p>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <a href="#" className="hover:text-gray-400 transition-colors">Политика конфиденциальности</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Пользовательское соглашение</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
