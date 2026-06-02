import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/app/actions/billing'
import ChangePasswordForm from './ChangePasswordForm'
import SignOutButton from '@/components/account/SignOutButton'
import DeleteAccountButton from '@/components/account/DeleteAccountButton'
import Link from 'next/link'
import {
  ArrowLeft, CreditCard, Shield, Check, Star,
  Mail, Calendar, Trophy, Zap, Infinity, Trash2
} from 'lucide-react'

export const metadata = { title: 'Личный кабинет — Tournable' }

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ count: tournamentCount }, plan, { data: profileData }] = await Promise.all([
    supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
    getUserPlan(),
    supabase
      .from('profiles')
      .select('plan_expires_at')
      .eq('id', user!.id)
      .maybeSingle(),
  ])

  const initials = user!.email?.slice(0, 2).toUpperCase() ?? '??'
  const joinDate = new Date(user!.created_at).toLocaleDateString('ru-RU', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const tc = tournamentCount ?? 0
  const isFreePlan = plan === 'free'
  const proExpiresAt = profileData?.plan_expires_at
    ? new Date(profileData.plan_expires_at).toLocaleDateString('ru-RU', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  return (
    <div className="max-w-2xl mx-auto">

      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 mb-6 transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Мои турниры
      </Link>

      <h1 className="text-2xl font-black text-gray-900 mb-8">Личный кабинет</h1>

      <div className="space-y-4">

        {/* ── Profile card ──────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Green top accent */}
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#047857,#10b981)' }} />
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-lg"
                style={{ background: 'linear-gradient(135deg,#047857,#059669)' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-black text-xl text-gray-900 mb-1">Профиль</h2>
                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-1">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="break-all">{user!.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <Calendar className="w-3 h-3 shrink-0" />
                  Участник с {joinDate}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xl font-black text-gray-900">{tc}</div>
                  <div className="text-xs text-gray-400">турниров создано</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  {isFreePlan ? (
                    <div className="text-xl font-black text-gray-900">{Math.max(0, 3 - tc)}</div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Infinity className="w-5 h-5 text-emerald-600" />
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {isFreePlan ? 'осталось по плану' : 'без лимита'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Subscription card ─────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-lg text-gray-900 mb-5 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Тарифный план
          </h2>

          {isFreePlan ? (
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Current plan info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-black text-gray-900">Старт</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">
                    Текущий план
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-gray-500">
                  {[
                    'До 3 турниров за всё время',
                    'До 16 команд в турнире',
                    'Круговой и плей-офф форматы',
                    'Публичная страница для участников',
                    'Статистика и экспорт PDF/PNG',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Upgrade block */}
              <div
                className="shrink-0 w-full sm:w-auto rounded-2xl p-5 text-white text-center"
                style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}
              >
                <div className="text-xs font-bold text-emerald-200 uppercase tracking-widest mb-2">Про</div>
                <div className="text-3xl font-black mb-0.5">4 990 ₸</div>
                <div className="text-xs text-emerald-200 mb-4">/ месяц</div>
                <ul className="space-y-1.5 text-xs text-emerald-100 mb-5 text-left">
                  {[
                    'Бесконечные турниры',
                    'До 64 команд',
                    'Live-табло в реальном времени',
                    'До 3 соредакторов',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-1.5">
                      <Star className="w-3 h-3 text-yellow-300 shrink-0" fill="currentColor" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/checkout"
                  className="block bg-white text-emerald-700 hover:bg-emerald-50 font-black py-2.5 rounded-xl transition-colors text-sm shadow-md"
                >
                  Перейти на Про →
                </Link>
                <p className="text-[10px] text-emerald-300 mt-2">44 990 ₸/год · скидка −25%</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-black text-gray-900">Про</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white uppercase tracking-wide"
                    style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}>
                    Активный план
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  {[
                    'Бесконечные турниры',
                    'До 64 команд в турнире',
                    'Live-табло в реальном времени',
                    'До 3 соредакторов',
                    'Круговой, плей-офф и групповой форматы',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                {proExpiresAt && (
                  <p className="mt-4 text-xs text-gray-400 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 shrink-0" />
                    Действует до: {proExpiresAt}
                  </p>
                )}
                {!proExpiresAt && (
                  <p className="mt-4 text-xs text-gray-400 flex items-center gap-1.5">
                    <Infinity className="w-3 h-3 shrink-0" />
                    Бессрочная подписка
                  </p>
                )}
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                <Link
                  href="https://wa.me/message/YHLE2IFII4MSJ1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Связаться с поддержкой
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Security card ─────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-black text-lg text-gray-900 mb-1 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Безопасность
          </h2>
          <p className="text-sm text-gray-400 mb-5">Email и пароль для входа в аккаунт</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-700">Email</div>
                <div className="text-xs text-gray-400 break-all">{user!.email}</div>
              </div>
            </div>
            <ChangePasswordForm />
          </div>
        </div>

        {/* ── Account actions: sign out (with confirmation) ─────────── */}
        <SignOutButton />

        {/* ── Danger zone: delete account ───────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-red-100 shadow-sm p-6">
          <h2 className="font-black text-lg text-gray-900 mb-1 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            Удаление аккаунта
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            Удаление необратимо: аккаунт, турниры и статистика будут стёрты безвозвратно.
            Чтобы исключить случайность, потребуется подтверждение. Подробнее — в{' '}
            <a href="/privacy" className="text-emerald-600 hover:underline">Политике конфиденциальности</a>.
          </p>
          <DeleteAccountButton email={user!.email!} />
        </div>

      </div>
    </div>
  )
}
