'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTournamentWithSetup } from '@/app/actions/tournaments'
import { uploadTournamentLogo, uploadTeamLogo } from '@/app/actions/logos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Camera, Plus, Trophy, X, Zap, Check, Settings2 } from 'lucide-react'
import Link from 'next/link'

const FORMATS = [
  { value: 'round_robin', label: 'Круговой',  emoji: '🔄', desc: 'Каждая команда играет с каждой. Идеально для лиг.' },
  { value: 'playoff',     label: 'Плей-офф',  emoji: '🏆', desc: 'Сетка на выбывание. Идеально для кубков.'         },
] as const

const ROUNDS_OPTIONS = [
  { value: 1, label: '1 круг' },
  { value: 2, label: '2 круга — дома и в гостях' },
  { value: 3, label: '3 круга' },
  { value: 4, label: '4 круга' },
]

function resizeToDataUrl(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext('2d')!
      const side = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/webp', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

function AvatarPicker({
  dataUrl, name, size, onPick, onRemove,
}: {
  dataUrl: string | null
  name: string
  size: number
  onPick: (dataUrl: string) => void
  onRemove?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const initials = name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
  const fontSize = Math.max(8, Math.floor(size * 0.38))

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const url = await resizeToDataUrl(file, 200)
    onPick(url)
  }

  return (
    <div className="relative inline-block flex-shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="block rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-emerald-400 transition-colors"
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={name} style={{ width: size, height: size }} className="object-cover" />
        ) : (
          <span
            className="rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center select-none"
            style={{ width: size, height: size, fontSize }}
          >
            {initials}
          </span>
        )}
      </button>
      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center shadow pointer-events-none">
        <Camera size={10} className="text-white" />
      </span>
      {dataUrl && onRemove && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 shadow"
        >
          <X size={8} className="text-white" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
      />
    </div>
  )
}

function StepDot({ n, current }: { n: number; current: number }) {
  const done   = current > n
  const active = current === n
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${
      done   ? 'bg-emerald-600 text-white' :
      active ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' :
               'bg-gray-100 text-gray-400'
    }`}>
      {done ? <Check size={14} /> : n}
    </div>
  )
}

function StepBar({ step }: { step: number }) {
  const labels = ['Название', 'Команды', 'Настройки', 'Старт']
  return (
    <div className="flex items-center mb-8">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <StepDot n={i + 1} current={step} />
            <span className={`text-xs font-bold hidden sm:block ${step === i + 1 ? 'text-emerald-700' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div className={`h-0.5 w-10 sm:w-16 mx-1 mb-4 sm:mb-0 transition-colors ${step > i + 1 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function NewTournamentPage() {
  const router = useRouter()

  // Step 1 state
  const [name, setName]           = useState('')
  const [format, setFormat]       = useState<'round_robin' | 'playoff'>('round_robin')
  const [numRounds, setNumRounds] = useState(2)

  // Step 2 state
  const [teamNames, setTeamNames] = useState<string[]>(['', ''])
  const [teamLogos, setTeamLogos] = useState<(string | null)[]>([null, null])
  const lastInputRef = useRef<HTMLInputElement>(null)

  // Step 3 state
  const [tournamentLogo, setTournamentLogo] = useState<string | null>(null)
  const [matchPeriods, setMatchPeriods]     = useState(2)
  const [extraTime, setExtraTime]           = useState(false)
  const [durationMins, setDurationMins]     = useState(45)
  const [pointsWin, setPointsWin]           = useState(3)
  const [pointsDraw, setPointsDraw]         = useState(1)
  const [pointsLoss, setPointsLoss]         = useState(0)

  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // ── Navigation ────────────────────────────────────────────────────
  function goToStep2() {
    if (!name.trim()) { setError('Введите название турнира'); return }
    setError(null); setStep(2)
  }

  function goToStep3() {
    if (filledTeams.length < 2) { setError('Добавьте минимум 2 команды'); return }
    setError(null); setStep(3)
  }

  function goToStep4() {
    setError(null); setStep(4)
  }

  // ── Team helpers ──────────────────────────────────────────────────
  function updateTeam(i: number, val: string) {
    setTeamNames(prev => prev.map((n, j) => j === i ? val : n))
  }

  function addTeamField() {
    setTeamNames(prev => [...prev, ''])
    setTeamLogos(prev => [...prev, null])
    setTimeout(() => lastInputRef.current?.focus(), 50)
  }

  function removeTeam(i: number) {
    setTeamNames(prev => prev.filter((_, j) => j !== i))
    setTeamLogos(prev => prev.filter((_, j) => j !== i))
  }

  function setTeamLogo(i: number, dataUrl: string | null) {
    setTeamLogos(prev => prev.map((l, j) => j === i ? dataUrl : l))
  }

  const filledTeams = teamNames.filter(n => n.trim())

  const matchCount = format === 'round_robin' && filledTeams.length >= 2
    ? Math.floor(filledTeams.length * (filledTeams.length - 1) / 2) * numRounds
    : 0

  // ── Create ────────────────────────────────────────────────────────
  async function handleCreate() {
    setLoading(true); setError(null)

    const result = await createTournamentWithSetup(name, format, numRounds, teamNames, {
      matchPeriods,
      extraTime,
      matchDurationMins: durationMins,
      pointsWin,
      pointsDraw,
      pointsLoss,
    })

    if (result.error) { setError(result.error); setLoading(false); return }

    const tournamentId = result.id!
    const teamIds = result.teamIds ?? []

    // Upload logos in parallel after creation
    const uploads: Promise<unknown>[] = []

    if (tournamentLogo) {
      uploads.push(uploadTournamentLogo(tournamentId, tournamentLogo))
    }

    const filledIndices = teamNames
      .map((n, i) => ({ name: n.trim(), origIdx: i }))
      .filter(({ name }) => !!name)

    filledIndices.forEach(({ origIdx }, teamIdx) => {
      const logoDataUrl = teamLogos[origIdx]
      const teamId = teamIds[teamIdx]
      if (logoDataUrl && teamId) {
        uploads.push(uploadTeamLogo(teamId, tournamentId, logoDataUrl))
      }
    })

    if (uploads.length > 0) await Promise.all(uploads)

    router.push(`/dashboard/tournament/${tournamentId}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft size={15} /> Мои турниры
      </Link>

      <StepBar step={step} />

      {/* ── Step 1: Name & Format ──────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">Новый турнир</h1>
            <p className="text-sm text-gray-400 mt-0.5">Шаг 1 из 4 — основная информация</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Название</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && goToStep2()}
              placeholder="например: Кубок компании 2026"
              maxLength={40}
              autoFocus
              className="text-base"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Формат</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormat(f.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    format === f.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className="text-xl mb-1">{f.emoji}</p>
                  <p className={`text-sm font-bold ${format === f.value ? 'text-emerald-700' : 'text-gray-800'}`}>{f.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {format === 'round_robin' && (
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700">Количество кругов</label>
              <div className="grid grid-cols-2 gap-2">
                {ROUNDS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNumRounds(opt.value)}
                    className={`py-2.5 px-3 rounded-xl border text-left text-sm transition-all ${
                      numRounds === opt.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <Button onClick={goToStep2} className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-bold">
            Далее <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      )}

      {/* ── Step 2: Teams ─────────────────────────────────────────── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">Команды</h1>
            <p className="text-sm text-gray-400 mt-0.5">Шаг 2 из 4 — добавьте участников и логотипы</p>
          </div>

          <div className="space-y-2">
            {teamNames.map((val, i) => (
              <div key={i} className="flex items-center gap-2">
                <AvatarPicker
                  dataUrl={teamLogos[i]}
                  name={val || `Команда ${i + 1}`}
                  size={36}
                  onPick={dataUrl => setTeamLogo(i, dataUrl)}
                  onRemove={() => setTeamLogo(i, null)}
                />
                <Input
                  ref={i === teamNames.length - 1 ? lastInputRef : undefined}
                  value={val}
                  onChange={e => updateTeam(i, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTeamField() }}
                  placeholder={`Команда ${i + 1}`}
                  maxLength={30}
                  className="flex-1"
                />
                {teamNames.length > 2 && (
                  <button onClick={() => removeTeam(i)} className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addTeamField}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-600 transition-colors py-1 ml-11"
            >
              <Plus size={14} /> Добавить ещё команду
            </button>
          </div>

          {filledTeams.length >= 2 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
              <Zap size={14} className="shrink-0" />
              <span>
                <span className="font-bold">{filledTeams.length} команд{filledTeams.length <= 4 ? filledTeams.length === 1 ? 'а' : 'ы' : ''}</span>
                {matchCount > 0 && <span className="text-emerald-600"> — {matchCount} матч{matchCount === 1 ? '' : matchCount <= 4 ? 'а' : 'ей'}</span>}
              </span>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setError(null); setStep(1) }} className="flex-1 h-11">
              <ArrowLeft size={15} className="mr-1.5" /> Назад
            </Button>
            <Button onClick={goToStep3} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 font-bold">
              Далее <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Settings ──────────────────────────────────────── */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Settings2 size={20} className="text-emerald-600" /> Настройки
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Шаг 3 из 4 — логотип и правила матча</p>
          </div>

          {/* Tournament logo */}
          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-700">Логотип турнира</p>
            <div className="flex items-center gap-4">
              <AvatarPicker
                dataUrl={tournamentLogo}
                name={name}
                size={64}
                onPick={setTournamentLogo}
                onRemove={() => setTournamentLogo(null)}
              />
              <p className="text-xs text-gray-400 leading-relaxed">
                Нажмите на аватар для загрузки.<br />JPG, PNG, WebP — до 1 МБ.
              </p>
            </div>
          </div>

          {/* Match periods */}
          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-700">Таймы</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                {[1, 2].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMatchPeriods(n)}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                      matchPeriods === n
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {n} {n === 1 ? 'тайм' : 'тайма'}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setExtraTime(v => !v)}
                  className={`relative rounded-full transition-colors cursor-pointer ${extraTime ? 'bg-emerald-600' : 'bg-gray-200'}`}
                  style={{ width: 40, height: 22 }}
                >
                  <span
                    className="absolute top-0.5 bg-white rounded-full shadow transition-transform"
                    style={{ left: 2, width: 18, height: 18, transform: extraTime ? 'translateX(18px)' : 'translateX(0)' }}
                  />
                </div>
                <span className="text-sm text-gray-600">Доп. время</span>
              </label>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-700">Длительность тайма</p>
            <div className="flex items-center gap-2">
              <Input
                type="number" min={1} max={90}
                value={durationMins}
                onChange={e => setDurationMins(parseInt(e.target.value) || 45)}
                className="w-20 h-8 text-sm text-center font-mono"
              />
              <span className="text-sm text-gray-500">минут</span>
            </div>
          </div>

          {/* Points system — round-robin only */}
          {format === 'round_robin' && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-700">Система очков</p>
              <div className="flex items-center gap-4">
                {(
                  [
                    { label: 'Победа', value: pointsWin,  setter: setPointsWin  as (v: number) => void },
                    { label: 'Ничья',  value: pointsDraw, setter: setPointsDraw as (v: number) => void },
                    { label: 'Пораж.', value: pointsLoss, setter: setPointsLoss as (v: number) => void },
                  ]
                ).map(({ label, value, setter }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
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

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setError(null); setStep(2) }} className="flex-1 h-11">
              <ArrowLeft size={15} className="mr-1.5" /> Назад
            </Button>
            <Button onClick={goToStep4} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 font-bold">
              Далее <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Confirm & Create ──────────────────────────────── */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">Всё готово!</h1>
            <p className="text-sm text-gray-400 mt-0.5">Шаг 4 из 4 — подтвердите и запустите</p>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-emerald-600 flex items-center justify-center shrink-0">
                {tournamentLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tournamentLogo} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <Trophy size={20} className="text-white" />
                )}
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg leading-tight">{name}</p>
                <p className="text-sm text-gray-500">
                  {FORMATS.find(f => f.value === format)?.label}
                  {format === 'round_robin' && (
                    <span> · {numRounds} {numRounds === 1 ? 'круг' : numRounds <= 4 ? 'круга' : 'кругов'}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="border-t border-emerald-100 pt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{filledTeams.length} команд</p>
              <div className="flex flex-wrap gap-2">
                {teamNames.map((t, i) => {
                  if (!t.trim()) return null
                  return (
                    <div key={i} className="flex items-center gap-1.5 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                      {teamLogos[i] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={teamLogos[i]!} alt={t} className="w-4 h-4 rounded-full object-cover" />
                      )}
                      {t}
                    </div>
                  )
                })}
              </div>
            </div>

            {format === 'round_robin' && matchCount > 0 && (
              <div className="border-t border-emerald-100 pt-3 flex items-center gap-2 text-sm text-emerald-700 font-medium">
                <Zap size={14} />
                Расписание из {matchCount} матч{matchCount === 1 ? 'а' : 'ей'} сгенерируется автоматически
              </div>
            )}

            <div className="border-t border-emerald-100 pt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>
                <span className="font-medium text-gray-700">Таймы:</span>{' '}
                {matchPeriods}×{durationMins} мин
              </span>
              {extraTime && <span className="text-emerald-600 font-medium">+ Доп. время</span>}
              {format === 'round_robin' && (
                <span>
                  <span className="font-medium text-gray-700">Очки:</span>{' '}
                  П{pointsWin} / Н{pointsDraw} / П{pointsLoss}
                </span>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setError(null); setStep(3) }} className="flex-1 h-11">
              <ArrowLeft size={15} className="mr-1.5" /> Назад
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 font-bold"
            >
              <Zap size={15} className="mr-1.5" />
              {loading ? 'Создаём…' : 'Создать турнир'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
