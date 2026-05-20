'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTournamentWithSetup } from '@/app/actions/tournaments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Plus, Trophy, X, Zap, Check } from 'lucide-react'
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
  const labels = ['Название', 'Команды', 'Готово']
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
            <div className={`h-0.5 w-12 sm:w-20 mx-1 mb-4 sm:mb-0 transition-colors ${step > i + 1 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function NewTournamentPage() {
  const router = useRouter()

  const [name, setName]           = useState('')
  const [format, setFormat]       = useState<'round_robin' | 'playoff'>('round_robin')
  const [numRounds, setNumRounds] = useState(2)

  const [teamNames, setTeamNames] = useState<string[]>(['', ''])
  const lastInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  function goToStep2() {
    if (!name.trim()) { setError('Введите название турнира'); return }
    setError(null); setStep(2)
  }

  function updateTeam(i: number, val: string) {
    setTeamNames(prev => prev.map((n, j) => j === i ? val : n))
  }

  function addTeamField() {
    setTeamNames(prev => [...prev, ''])
    setTimeout(() => lastInputRef.current?.focus(), 50)
  }

  function removeTeam(i: number) {
    setTeamNames(prev => prev.filter((_, j) => j !== i))
  }

  const filledTeams = teamNames.filter(n => n.trim())

  function goToStep3() {
    if (filledTeams.length < 2) { setError('Добавьте минимум 2 команды'); return }
    setError(null); setStep(3)
  }

  async function handleCreate() {
    setLoading(true); setError(null)
    const result = await createTournamentWithSetup(name, format, numRounds, teamNames)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    router.push(`/dashboard/tournament/${result.id}`)
  }

  const matchCount = format === 'round_robin' && filledTeams.length >= 2
    ? Math.floor(filledTeams.length * (filledTeams.length - 1) / 2) * numRounds
    : 0

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft size={15} /> Мои турниры
      </Link>

      <StepBar step={step} />

      {/* ── Step 1 ──────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">Новый турнир</h1>
            <p className="text-sm text-gray-400 mt-0.5">Шаг 1 из 3 — основная информация</p>
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

      {/* ── Step 2 ──────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">Команды</h1>
            <p className="text-sm text-gray-400 mt-0.5">Шаг 2 из 3 — добавьте участников</p>
          </div>

          <div className="space-y-2">
            {teamNames.map((val, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
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
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-600 transition-colors py-1"
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
            <Button variant="outline" onClick={() => { setError(null); setStep(1) }} className="flex-1">
              <ArrowLeft size={15} className="mr-1.5" /> Назад
            </Button>
            <Button onClick={goToStep3} className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold">
              Далее <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3 ──────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">Всё готово!</h1>
            <p className="text-sm text-gray-400 mt-0.5">Шаг 3 из 3 — подтвердите и запустите</p>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                <Trophy size={20} className="text-white" />
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
              <div className="flex flex-wrap gap-1.5">
                {filledTeams.map((t, i) => (
                  <span key={i} className="bg-white border border-emerald-200 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {format === 'round_robin' && matchCount > 0 && (
              <div className="border-t border-emerald-100 pt-3 flex items-center gap-2 text-sm text-emerald-700 font-medium">
                <Zap size={14} />
                Расписание из {matchCount} матч{matchCount === 1 ? 'а' : matchCount <= 4 ? 'ей' : 'ей'} сгенерируется автоматически
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setError(null); setStep(2) }} className="flex-1">
              <ArrowLeft size={15} className="mr-1.5" /> Назад
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="flex-2 bg-emerald-600 hover:bg-emerald-700 font-bold h-11 px-8"
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
