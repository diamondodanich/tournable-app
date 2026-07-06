'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Trophy, Zap, BarChart2, Share2, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// ─── i18n ────────────────────────────────────────────────────────────────────
type Lang = 'ru' | 'kz' | 'en'

function getLang(): Lang {
  if (typeof document === 'undefined') return 'ru'
  const m = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/)
  const v = m?.[1]
  return v === 'kz' || v === 'en' ? v : 'ru'
}

const T = {
  ru: {
    features: [
      { title: 'Расписание за 30 секунд', desc: 'Выберите формат, добавьте команды — расписание готово' },
      { title: 'Таблицы и статистика', desc: 'Обновляются автоматически после каждого матча' },
      { title: 'Поделитесь ссылкой', desc: 'Участники следят за результатами без регистрации' },
    ],
    welcomeTitle: 'Добро пожаловать!',
    welcomeSub1: 'Вы в одном шаге от первого турнира.',
    welcomeSub2: 'Как вас зовут?',
    namePh: 'Ваше имя или псевдоним',
    nameOptional: 'Необязательно — можно пропустить',
    saving: 'Сохраняем…',
    continue: 'Продолжить',
    greatName: (name: string) => `Отлично, ${name}!`,
    allReady: 'Аккаунт готов!',
    tagline: 'Всё, что нужно организатору турнира — уже внутри',
    goingTo: 'Переходим…',
    createFirst: 'Создать первый турнир',
    goToAll: 'Перейти ко всем турнирам',
  },
  kz: {
    features: [
      { title: '30 секундта кесте', desc: 'Форматты таңдап, командаларды қосыңыз — кесте дайын' },
      { title: 'Кестелер мен статистика', desc: 'Әр матчтан кейін автоматты түрде жаңарады' },
      { title: 'Сілтемемен бөлісіңіз', desc: 'Қатысушылар тіркелусіз нәтижелерді қадағалайды' },
    ],
    welcomeTitle: 'Қош келдіңіз!',
    welcomeSub1: 'Сіз алғашқы турнирге бір қадам жақынсыз.',
    welcomeSub2: 'Атыңыз кім?',
    namePh: 'Атыңыз немесе лақап атыңыз',
    nameOptional: 'Міндетті емес — өткізіп жіберуге болады',
    saving: 'Сақталуда…',
    continue: 'Жалғастыру',
    greatName: (name: string) => `Керемет, ${name}!`,
    allReady: 'Аккаунт дайын!',
    tagline: 'Ұйымдастырушыға қажеттінің бәрі — ішінде',
    goingTo: 'Өтуде…',
    createFirst: 'Алғашқы турнирді құру',
    goToAll: 'Барлық турнирлерге өту',
  },
  en: {
    features: [
      { title: 'Schedule in 30 seconds', desc: 'Pick a format, add teams — the schedule is ready' },
      { title: 'Standings and stats', desc: 'Updated automatically after every match' },
      { title: 'Share a link', desc: 'Participants follow results without signing up' },
    ],
    welcomeTitle: 'Welcome!',
    welcomeSub1: "You're one step away from your first tournament.",
    welcomeSub2: "What's your name?",
    namePh: 'Your name or nickname',
    nameOptional: 'Optional — you can skip this',
    saving: 'Saving…',
    continue: 'Continue',
    greatName: (name: string) => `Great, ${name}!`,
    allReady: 'Your account is ready!',
    tagline: 'Everything a tournament organizer needs — already inside',
    goingTo: 'Redirecting…',
    createFirst: 'Create your first tournament',
    goToAll: 'Go to all tournaments',
  },
} as const

export default function OnboardingPage() {
  const router = useRouter()
  const lang = getLang()
  const t = T[lang]
  const FEATURES = [
    { icon: Zap, ...t.features[0] },
    { icon: BarChart2, ...t.features[1] },
    { icon: Share2, ...t.features[2] },
  ]
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
      {/* Logo — real brand mark + wordmark (matches the app header) */}
      <div className="mb-8 flex items-center gap-2.5">
        <Image src="/logo-green.png" alt="Tournable" width={40} height={40} className="w-9 h-9 object-contain" priority />
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
              <h1 className="text-2xl font-black text-gray-900">{t.welcomeTitle}</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                {t.welcomeSub1}
                <br />{t.welcomeSub2}
              </p>
            </div>

            <div className="space-y-2">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStep1()}
                placeholder={t.namePh}
                className="text-base h-12 rounded-xl text-center"
                autoFocus
                maxLength={40}
              />
              <p className="text-xs text-gray-400 text-center">
                {t.nameOptional}
              </p>
            </div>

            <Button
              onClick={handleStep1}
              disabled={saving}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base font-bold rounded-xl"
            >
              {saving ? t.saving : t.continue}
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
                  {name.trim() ? t.greatName(name.trim()) : t.allReady}
                </h1>
                <p className="text-gray-500 text-sm">
                  {t.tagline}
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
                {saving ? t.goingTo : t.createFirst}
              </Button>
            </div>

            {/* Secondary link */}
            <div className="text-center">
              <button
                onClick={() => handleFinish('dashboard')}
                disabled={saving}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                {t.goToAll}
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
