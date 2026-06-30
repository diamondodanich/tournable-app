'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Trophy, Zap, BarChart2, Share2, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const FEATURES = [
  {
    icon: Zap,
    title: 'Расписание за 30 секунд',
    desc: 'Выберите формат, добавьте команды — расписание готово',
  },
  {
    icon: BarChart2,
    title: 'Таблицы и статистика',
    desc: 'Обновляются автоматически после каждого матча',
  },
  {
    icon: Share2,
    title: 'Поделитесь ссылкой',
    desc: 'Участники следят за результатами без регистрации',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]       = useState<1 | 2>(1)
  const [name, setName]       = useState('')
  const [saving, setSaving]   = useState(false)

  async function handleStep1() {
    setSaving(true)
    const supabase = createClient()

    // Save display name if provided (non-blocking)
    if (name.trim()) {
      await supabase.auth.updateUser({
        data: { display_name: name.trim() },
      })
    }

    setSaving(false)
    setStep(2)
  }

  async function handleFinish(goTo: 'new' | 'dashboard') {
    setSaving(true)
    const supabase = createClient()
    await supabase.auth.updateUser({ data: { onboarding_completed: true } })
    setSaving(false)
    router.push(goTo === 'new' ? '/dashboard/new' : '/dashboard')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #ffffff 100%)' }}
    >
      {/* Logo */}
      <div className="mb-8">
        <span
          className="text-2xl font-black text-emerald-700 tracking-tight"
          style={{ letterSpacing: '-0.03em' }}
        >
          TOURNABLE
        </span>
      </div>

      <div className="w-full max-w-md">
        {/* ── Step 1: Name ───────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 space-y-6">
            {/* Trophy icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg">
                <Trophy size={28} className="text-white" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black text-gray-900">Добро пожаловать!</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Вы в одном шаге от первого турнира.
                <br />Как вас зовут?
              </p>
            </div>

            <div className="space-y-2">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStep1()}
                placeholder="Ваше имя или псевдоним"
                className="text-base h-12 rounded-xl text-center"
                autoFocus
                maxLength={40}
              />
              <p className="text-xs text-gray-400 text-center">
                Необязательно — можно пропустить
              </p>
            </div>

            <Button
              onClick={handleStep1}
              disabled={saving}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base font-bold rounded-xl"
            >
              {saving ? 'Сохраняем…' : 'Продолжить'}
              <ArrowRight size={17} className="ml-2" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Features + CTA ─────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 mb-1">
                  <Check size={20} className="text-emerald-600" />
                </div>
                <h1 className="text-2xl font-black text-gray-900">
                  {name.trim() ? `Отлично, ${name.trim()}!` : 'Всё готово!'}
                </h1>
                <p className="text-gray-500 text-sm">
                  Tournable умеет всё, что нужно организатору
                </p>
              </div>

              {/* Features list */}
              <div className="space-y-3">
                {FEATURES.map(f => {
                  const Icon = f.icon
                  return (
                    <div key={f.title} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <Icon size={16} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{f.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Primary CTA */}
              <Button
                onClick={() => handleFinish('new')}
                disabled={saving}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base font-bold rounded-xl"
              >
                <Trophy size={17} className="mr-2" />
                {saving ? 'Переходим…' : 'Создать первый турнир'}
              </Button>
            </div>

            {/* Secondary link */}
            <div className="text-center">
              <button
                onClick={() => handleFinish('dashboard')}
                disabled={saving}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Перейти ко всем турнирам
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mt-8">
        {[1, 2].map(s => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              s === step ? 'w-6 bg-emerald-600' : s < step ? 'w-3 bg-emerald-300' : 'w-3 bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
