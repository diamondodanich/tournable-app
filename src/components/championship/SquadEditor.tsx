'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Trash2, Loader2, Shirt, Plus, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { getSquad, saveSquad } from '@/app/actions/leagues'
import { uploadPlayerPhoto } from '@/app/actions/logos'

type Lang = 'ru' | 'kz' | 'en'
type Cat = 'gk' | 'def' | 'mid' | 'fwd' | 'gen'
type Player = { name: string; number: string; photoUrl?: string | null; photoData?: string | null }
type Slot = Player | null

// Center-crop an image file to a square webp data URL for a player avatar.
function fileToAvatar(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = size; c.height = size
      const ctx = c.getContext('2d')
      if (!ctx) { reject(new Error('no ctx')); return }
      const s = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/webp', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

const CAT_POSITION: Record<Cat, string> = {
  gk: 'goalkeeper', def: 'defender', mid: 'midfielder', fwd: 'forward', gen: 'other',
}
const POSITION_CAT: Record<string, Cat> = {
  goalkeeper: 'gk', defender: 'def', midfielder: 'mid', forward: 'fwd', other: 'gen',
}

// Football/futsal formations expressed as rows (from defence to attack, GK implicit first).
const FOOTBALL_FORMATIONS: Record<string, { cat: Cat; n: number }[]> = {
  '4-4-2':   [{ cat: 'gk', n: 1 }, { cat: 'def', n: 4 }, { cat: 'mid', n: 4 }, { cat: 'fwd', n: 2 }],
  '4-3-3':   [{ cat: 'gk', n: 1 }, { cat: 'def', n: 4 }, { cat: 'mid', n: 3 }, { cat: 'fwd', n: 3 }],
  '3-5-2':   [{ cat: 'gk', n: 1 }, { cat: 'def', n: 3 }, { cat: 'mid', n: 5 }, { cat: 'fwd', n: 2 }],
  '4-2-3-1': [{ cat: 'gk', n: 1 }, { cat: 'def', n: 4 }, { cat: 'mid', n: 2 }, { cat: 'mid', n: 3 }, { cat: 'fwd', n: 1 }],
  '5-3-2':   [{ cat: 'gk', n: 1 }, { cat: 'def', n: 5 }, { cat: 'mid', n: 3 }, { cat: 'fwd', n: 2 }],
}
const FUTSAL_FORMATIONS: Record<string, { cat: Cat; n: number }[]> = {
  '1-2-1': [{ cat: 'gk', n: 1 }, { cat: 'def', n: 1 }, { cat: 'mid', n: 2 }, { cat: 'fwd', n: 1 }],
  '2-2':   [{ cat: 'gk', n: 1 }, { cat: 'def', n: 2 }, { cat: 'fwd', n: 2 }],
  '2-1-1': [{ cat: 'gk', n: 1 }, { cat: 'def', n: 2 }, { cat: 'mid', n: 1 }, { cat: 'fwd', n: 1 }],
}

const FOOTBALL_SPORTS = new Set(['football', 'efootball'])
const FUTSAL_SPORTS = new Set(['futsal'])
const GENERIC_STARTERS: Record<string, number> = {
  basketball: 5, streetball: 5, ebasketball: 5, volleyball: 6, beach_volleyball: 2, hockey: 6, other: 5,
}

const T = {
  ru: {
    title: 'Состав', formation: 'Схема', bench: 'Запасные', starters: 'Основной состав',
    save: 'Сохранить состав', saving: 'Сохраняем…', saved: 'Состав сохранён',
    name: 'Имя', number: '№', done: 'Готово', clear: 'Очистить',
    addSub: 'Добавить запасного', empty: 'Нажмите на позицию, чтобы добавить игрока',
    loadErr: 'Не удалось загрузить состав',
  },
  kz: {
    title: 'Құрам', formation: 'Схема', bench: 'Қосалқылар', starters: 'Негізгі құрам',
    save: 'Құрамды сақтау', saving: 'Сақталуда…', saved: 'Құрам сақталды',
    name: 'Аты', number: '№', done: 'Дайын', clear: 'Тазарту',
    addSub: 'Қосалқы қосу', empty: 'Ойыншы қосу үшін позицияны басыңыз',
    loadErr: 'Құрамды жүктеу мүмкін болмады',
  },
  en: {
    title: 'Squad', formation: 'Formation', bench: 'Substitutes', starters: 'Starting XI',
    save: 'Save squad', saving: 'Saving…', saved: 'Squad saved',
    name: 'Name', number: '#', done: 'Done', clear: 'Clear',
    addSub: 'Add substitute', empty: 'Tap a position to add a player',
    loadErr: 'Could not load the squad',
  },
} as const

const CAT_COLORS: Record<Cat, string> = {
  gk: '#f59e0b', def: '#38bdf8', mid: '#34d399', fwd: '#f43f5e', gen: '#a78bfa',
}

function rowsFor(sport: string | null, formation: string): { cat: Cat; n: number }[] {
  if (FOOTBALL_SPORTS.has(sport ?? '')) return FOOTBALL_FORMATIONS[formation] ?? FOOTBALL_FORMATIONS['4-4-2']
  if (FUTSAL_SPORTS.has(sport ?? '')) return FUTSAL_FORMATIONS[formation] ?? FUTSAL_FORMATIONS['1-2-1']
  const n = GENERIC_STARTERS[sport ?? 'other'] ?? 5
  return [{ cat: 'gen', n }]
}

export default function SquadEditor({ leagueId, leagueTeamId, teamName, sport, brand = '#7c3aed', lang = 'ru', onClose }: {
  leagueId: string
  leagueTeamId: string
  teamName: string
  sport: string | null
  brand?: string
  lang?: Lang
  onClose: () => void
}) {
  const tx = T[lang]
  const isFootball = FOOTBALL_SPORTS.has(sport ?? '')
  const isFutsal = FUTSAL_SPORTS.has(sport ?? '')
  const formationSet = isFootball ? FOOTBALL_FORMATIONS : isFutsal ? FUTSAL_FORMATIONS : null

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formation, setFormation] = useState(isFootball ? '4-4-2' : isFutsal ? '1-2-1' : 'flat')
  const [rows, setRows] = useState<{ cat: Cat; n: number }[]>(() => rowsFor(sport, isFootball ? '4-4-2' : isFutsal ? '1-2-1' : 'flat'))
  const [assigned, setAssigned] = useState<Slot[]>([])
  const [bench, setBench] = useState<Player[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftNum, setDraftNum] = useState('')
  const [draftPhotoUrl, setDraftPhotoUrl] = useState<string | null>(null)
  const [draftPhotoData, setDraftPhotoData] = useState<string | null>(null)
  const draftNameRef = useRef<HTMLInputElement>(null)

  // Smart entry: once the number reaches 2 digits, jump to the name field.
  function onDraftNum(v: string) {
    setDraftNum(v)
    if (v.replace(/\D/g, '').length >= 2) draftNameRef.current?.focus()
  }

  useEffect(() => { setMounted(true) }, [])

  // Load existing squad and lay it out into the default formation.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const players = await getSquad(leagueTeamId)
        if (cancelled) return
        const r = rowsFor(sport, formation)
        const totalSlots = r.reduce((s, row) => s + row.n, 0)
        // Sort players by position category so they land in the right rows.
        const order: Cat[] = ['gk', 'def', 'mid', 'fwd', 'gen']
        const sorted = [...players].sort((a, b) =>
          order.indexOf(POSITION_CAT[a.position] ?? 'gen') - order.indexOf(POSITION_CAT[b.position] ?? 'gen'))
        const slots: Slot[] = Array(totalSlots).fill(null)
        const catSlotIdx: Record<Cat, number[]> = { gk: [], def: [], mid: [], fwd: [], gen: [] }
        let idx = 0
        for (const row of r) { for (let i = 0; i < row.n; i++) { catSlotIdx[row.cat].push(idx); idx++ } }
        const benchOut: Player[] = []
        const cursor: Record<Cat, number> = { gk: 0, def: 0, mid: 0, fwd: 0, gen: 0 }
        for (const p of sorted) {
          const cat = POSITION_CAT[p.position] ?? 'gen'
          const targetCat = catSlotIdx[cat].length ? cat : 'gen'
          const slotList = catSlotIdx[targetCat]
          const entry: Player = { name: p.name, number: p.number != null ? String(p.number) : '', photoUrl: p.photo_url }
          if (cursor[targetCat] < slotList.length) {
            slots[slotList[cursor[targetCat]]] = entry
            cursor[targetCat]++
          } else {
            benchOut.push(entry)
          }
        }
        setRows(r)
        setAssigned(slots)
        setBench(benchOut)
      } catch {
        toast.error(tx.loadErr)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueTeamId])

  function changeFormation(f: string) {
    setFormation(f)
    const r = rowsFor(sport, f)
    const total = r.reduce((s, row) => s + row.n, 0)
    // Preserve currently placed + bench players, refill new slots in order.
    const pool = [...(assigned.filter(Boolean) as Player[]), ...bench]
    const slots: Slot[] = Array(total).fill(null)
    for (let i = 0; i < Math.min(total, pool.length); i++) slots[i] = pool[i]
    const overflow = pool.slice(total)
    setRows(r)
    setAssigned(slots)
    setBench(overflow)
  }

  function openEditor(slotIdx: number) {
    setEditing(slotIdx)
    const cur = assigned[slotIdx]
    setDraftName(cur?.name ?? '')
    setDraftNum(cur?.number ?? '')
    setDraftPhotoUrl(cur?.photoUrl ?? null)
    setDraftPhotoData(cur?.photoData ?? null)
  }

  function commitEditor() {
    if (editing === null) return
    const name = draftName.trim()
    setAssigned(prev => prev.map((s, i) => i === editing
      ? (name ? { name, number: draftNum.trim(), photoUrl: draftPhotoUrl, photoData: draftPhotoData } : null)
      : s))
    setEditing(null); setDraftName(''); setDraftNum(''); setDraftPhotoUrl(null); setDraftPhotoData(null)
  }

  function clearSlot() {
    if (editing === null) return
    setAssigned(prev => prev.map((s, i) => i === editing ? null : s))
    setEditing(null); setDraftName(''); setDraftNum(''); setDraftPhotoUrl(null); setDraftPhotoData(null)
  }

  async function pickDraftPhoto(file: File) {
    try { setDraftPhotoData(await fileToAvatar(file)) } catch {}
  }

  function addBench() {
    setBench(prev => [...prev, { name: '', number: '' }])
  }
  function updateBench(i: number, patch: Partial<Player>) {
    setBench(prev => prev.map((b, j) => j === i ? { ...b, ...patch } : b))
  }
  async function pickBenchPhoto(i: number, file: File) {
    try { const data = await fileToAvatar(file); updateBench(i, { photoData: data }) } catch {}
  }
  function removeBench(i: number) {
    setBench(prev => prev.filter((_, j) => j !== i))
  }

  async function handleSave() {
    setSaving(true)
    // Map each slot to its category via the rows layout.
    const slotCats: Cat[] = []
    for (const row of rows) for (let i = 0; i < row.n; i++) slotCats.push(row.cat)
    type Full = { name: string; number: number | null; position: string; photo_url: string | null; photoData: string | null }
    const full: Full[] = []
    assigned.forEach((s, i) => {
      if (s?.name.trim()) full.push({
        name: s.name.trim(),
        number: s.number.trim() ? parseInt(s.number) : null,
        position: CAT_POSITION[slotCats[i] ?? 'gen'],
        photo_url: s.photoUrl ?? null,
        photoData: s.photoData ?? null,
      })
    })
    bench.forEach(b => {
      if (b.name.trim()) full.push({
        name: b.name.trim(),
        number: b.number.trim() ? parseInt(b.number) : null,
        position: 'other',
        photo_url: b.photoUrl ?? null,
        photoData: b.photoData ?? null,
      })
    })

    const res = await saveSquad(leagueTeamId, leagueId,
      full.map(f => ({ name: f.name, number: f.number, position: f.position, photo_url: f.photo_url })))
    if (res.error) { setSaving(false); toast.error(res.error); return }

    // Attach freshly-picked photos to their new player ids (matched by name + number).
    const inserted = res.inserted ?? []
    const used = new Set<number>()
    await Promise.all(full.filter(f => f.photoData).map(async f => {
      const idx = inserted.findIndex((r, j) => !used.has(j) && r.name === f.name && (r.number ?? null) === (f.number ?? null))
      if (idx >= 0) { used.add(idx); await uploadPlayerPhoto(inserted[idx].id, f.photoData!) }
    }))

    setSaving(false)
    toast.success(tx.saved)
    onClose()
  }

  if (!mounted) return null

  // Build render rows with their slot indices
  let running = 0
  const renderRows = rows.map(row => {
    const items = Array.from({ length: row.n }, (_, i) => ({ slotIdx: running + i, cat: row.cat }))
    running += row.n
    return { cat: row.cat, items }
  })

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${brand}18` }}>
              <Shirt size={17} style={{ color: brand }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 leading-none">{tx.title}</p>
              <p className="font-black text-gray-900 break-words leading-tight">{teamName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-gray-300" size={26} /></div>
        ) : (
          <div className="overflow-y-auto px-5 py-4 space-y-4">
            {/* Formation selector */}
            {formationSet && (
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">{tx.formation}</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {Object.keys(formationSet).map(f => (
                    <button key={f} onClick={() => changeFormation(f)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        formation === f ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      style={formation === f ? { background: brand } : undefined}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pitch / starters */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">{tx.starters}</p>
              <div className="rounded-2xl p-3 sm:p-4 flex flex-col gap-4"
                style={{ background: 'linear-gradient(180deg,#166534,#15803d)' }}>
                {renderRows.map((row, ri) => (
                  <div key={ri} className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                    {row.items.map(({ slotIdx, cat }) => {
                      const p = assigned[slotIdx]
                      return (
                        <button key={slotIdx} onClick={() => openEditor(slotIdx)}
                          className="flex flex-col items-center gap-1 group">
                          <span className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-white border-2 border-white/70 shadow-md overflow-hidden transition-transform group-hover:scale-105"
                            style={{ background: p ? CAT_COLORS[cat] : 'rgba(255,255,255,0.15)' }}>
                            {p?.photoData || p?.photoUrl
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={p.photoData || p.photoUrl || ''} alt="" className="w-full h-full object-cover" />
                              : p ? (p.number || p.name.slice(0, 2).toUpperCase()) : <Plus size={16} className="text-white/80" />}
                          </span>
                          <span className="text-[10px] font-bold text-white/90 max-w-[64px] truncate">
                            {p?.name || ''}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
              {assigned.every(s => !s) && (
                <p className="text-xs text-gray-400 text-center mt-2">{tx.empty}</p>
              )}
            </div>

            {/* Bench */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-500">{tx.bench}</p>
                <button onClick={addBench} className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: brand }}>
                  <Plus size={13} /> {tx.addSub}
                </button>
              </div>
              <div className="space-y-2">
                {bench.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <label className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer">
                      {b.photoData || b.photoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={b.photoData || b.photoUrl || ''} alt="" className="w-full h-full object-cover" />
                        : <Camera size={14} className="text-gray-400" />}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) pickBenchPhoto(i, f) }} />
                    </label>
                    <input value={b.number} onChange={e => updateBench(i, { number: e.target.value })}
                      placeholder={tx.number} type="number"
                      className="w-14 px-2 py-2 rounded-lg border border-gray-200 focus:border-gray-400 outline-none text-sm text-center" />
                    <input value={b.name} onChange={e => updateBench(i, { name: e.target.value })}
                      placeholder={tx.name}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 outline-none text-sm" />
                    <button onClick={() => removeBench(i)} className="text-gray-300 hover:text-red-400 p-1"><Trash2 size={15} /></button>
                  </div>
                ))}
                {bench.length === 0 && <p className="text-xs text-gray-300">—</p>}
              </div>
            </div>
          </div>
        )}

        {/* Save bar */}
        {!loading && (
          <div className="border-t border-gray-100 p-4">
            <button onClick={handleSave} disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 text-white font-bold text-sm py-3 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: brand }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? tx.saving : tx.save}
            </button>
          </div>
        )}
      </div>

      {/* Slot editor popover */}
      {editing !== null && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-gray-900/40" />
          <div className="relative w-full max-w-xs bg-white rounded-2xl shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <label className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer relative">
                {draftPhotoData || draftPhotoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={draftPhotoData || draftPhotoUrl || ''} alt="" className="w-full h-full object-cover" />
                  : <Camera size={18} className="text-gray-400" />}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) pickDraftPhoto(f) }} />
              </label>
              <div className="flex-1 flex items-center gap-2">
                <input autoFocus value={draftNum} onChange={e => onDraftNum(e.target.value)}
                  placeholder={tx.number} type="number"
                  className="w-14 px-2 py-2 rounded-lg border border-gray-200 focus:border-gray-400 outline-none text-sm text-center" />
                <input ref={draftNameRef} value={draftName} onChange={e => setDraftName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && commitEditor()}
                  placeholder={tx.name}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-400 outline-none text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={commitEditor}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-white font-bold text-sm py-2 rounded-lg"
                style={{ background: brand }}>
                <Check size={14} /> {tx.done}
              </button>
              <button onClick={clearSlot}
                className="inline-flex items-center gap-1.5 text-gray-400 hover:text-red-400 font-medium text-sm px-3 py-2 rounded-lg">
                <Trash2 size={14} /> {tx.clear}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}
