import { createClient } from '@/lib/supabase/server'
import { getUserPlan, getPaymentHistory } from '@/app/actions/billing'
import ChangePasswordForm from './ChangePasswordForm'
import CancelSubscriptionButton from './CancelSubscriptionButton'
import SignOutButton from '@/components/account/SignOutButton'
import DeleteAccountButton from '@/components/account/DeleteAccountButton'
import AdminPlanButton from './AdminPlanButton'
import Link from 'next/link'
import {
  ArrowLeft, CreditCard, Shield, Check, Star,
  Mail, Calendar, Trophy, Zap, Infinity, RefreshCw, Clock, Crown,
} from 'lucide-react'

export const metadata = { title: 'Личный кабинет — Tournable' }

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ count: tournamentCount }, plan, { data: profileData }, payments] = await Promise.all([
    supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
    getUserPlan(),
    supabase
      .from('profiles')
      .select('plan_expires_at, is_admin')
      .eq('id', user!.id)
      .maybeSingle(),
    getPaymentHistory(),
  ])

  const initials = user!.email?.slice(0, 2).toUpperCase() ?? '??'
  const joinDate = new Date(user!.created_at).toLocaleDateString('ru-RU', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const tc = tournamentCount ?? 0
  const isFreePlan = plan === 'free'
  const isEnterprise = plan === 'enterprise'
  const isAdmin = profileData?.is_admin === true
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
        Все турниры
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

          {isEnterprise ? (
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-black text-gray-900">Enterprise</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white uppercase tracking-wide"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                    Активный план
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  {[
                    'Безлимитные турниры и команды',
                    'Чемпионаты с сезонами',
                    'Профили команд и игроков',
                    'Составы к матчам',
                    'Углублённая статистика и аналитика',
                    'До 10 соредакторов',
                    'Приоритетная поддержка 24/7',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : isFreePlan ? (
            <div className="space-y-5">
              {/* Current plan — compact banner */}
              <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-black text-gray-900">Старт</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 uppercase tracking-wide">
                    Текущий план
                  </span>
                </div>
                <span className="text-xs text-gray-400">3 турнира · 16 команд · бесплатно</span>
              </div>

              <p className="text-sm text-gray-500">
                Откройте больше возможностей — выберите план под свою задачу:
              </p>

              {/* Paid plans — horizontal, side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* PRO */}
                <div
                  className="rounded-2xl p-5 text-white flex flex-col"
                  style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}
                >
                  <div className="text-xs font-bold text-emerald-200 uppercase tracking-widest mb-2">Про</div>
                  <div className="flex items-baseline gap-1.5 mb-4">
                    <span className="text-3xl font-black">4 990 ₸</span>
                    <span className="text-xs text-emerald-200">/ месяц</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-50 mb-5 flex-1">
                    {[
                      'Безлимит турниров и до 64 команд',
                      'Live-табло в реальном времени',
                      'Все форматы: лига, группы, плей-офф',
                      'До 3 соредакторов',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-1.5">
                        <Star className="w-3 h-3 text-yellow-300 shrink-0 mt-0.5" fill="currentColor" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/checkout"
                    className="block text-center bg-white text-emerald-700 hover:bg-emerald-50 font-black py-2.5 rounded-xl transition-colors text-sm shadow-md"
                  >
                    Перейти на Про
                  </Link>
                  <p className="text-[10px] text-emerald-300 mt-2 text-center">44 990 ₸ в год — выгода 25%</p>
                </div>

                {/* Enterprise */}
                <div
                  className="rounded-2xl p-5 text-white flex flex-col relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,#5b21b6,#a855f7)' }}
                >
                  <span className="absolute top-3 right-3 text-[9px] font-black px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wide">Максимум</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-violet-200 uppercase tracking-widest mb-2">
                    <Crown className="w-3 h-3" /> Enterprise
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-4">
                    <span className="text-3xl font-black">39 990 ₸</span>
                    <span className="text-xs text-violet-200">/ месяц</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-violet-50 mb-5 flex-1">
                    {[
                      'Всё из Про без ограничений',
                      'Чемпионаты с сезонами и архивом',
                      'Профили команд и игроков, составы',
                      'Углублённая статистика и аналитика',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-1.5">
                        <Crown className="w-3 h-3 text-violet-200 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/checkout/enterprise"
                    className="block text-center bg-white text-violet-700 hover:bg-violet-50 font-black py-2.5 rounded-xl transition-colors text-sm shadow-md"
                  >
                    Подключить Enterprise
                  </Link>
                  <p className="text-[10px] text-violet-300 mt-2 text-center">349 990 ₸ в год — выгода 25%</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
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
                    href="/checkout"
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg,#047857,#10b981)' }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Продлить подписку
                  </Link>
                </div>
              </div>
              {/* Enterprise upsell for Pro users */}
              <Link
                href="/checkout/enterprise"
                className="mt-5 flex items-center justify-between gap-3 rounded-xl p-4 text-white transition-opacity hover:opacity-95"
                style={{ background: 'linear-gradient(135deg,#5b21b6,#a855f7)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm">Перейти на Enterprise</p>
                    <p className="text-xs text-violet-200">Лиги, профили игроков, составы, углублённая статистика</p>
                  </div>
                </div>
                <span className="text-xs font-bold whitespace-nowrap shrink-0">от 39 990 ₸ →</span>
              </Link>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <CancelSubscriptionButton />
              </div>
            </div>
          ) /* end !isFreePlan && !isEnterprise */}
        </div>

        {/* ── Payment history ───────────────────────────────────────── */}
        {payments.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-black text-lg text-gray-900 mb-5 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              История платежей
            </h2>
            <div className="space-y-2">
              {payments.map(p => {
                const date = new Date(p.started_at).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })
                const expires = p.expires_at
                  ? new Date(p.expires_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                  : null
                return (
                  <div key={p.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900">Tournable Pro</div>
                      <div className="text-xs text-gray-400">{date}{expires ? ` — до ${expires}` : ''}</div>
                    </div>
                    <div className="shrink-0 text-sm font-black text-gray-900">
                      {p.amount_kzt ? `${p.amount_kzt.toLocaleString('ru-RU')} ₸` : '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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

        {/* ── Admin: plan switcher ──────────────────────────────────── */}
        {isAdmin && (
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6">
            <h2 className="font-black text-sm text-violet-500 uppercase tracking-widest mb-4">Admin — переключить план</h2>
            <AdminPlanButton userId={user!.id} currentPlan={plan} />
          </div>
        )}

        {/* ── Danger zone: delete account (hidden link) ─────────────── */}
        <div className="pt-2 pb-4 flex justify-center">
          <DeleteAccountButton email={user!.email!} />
        </div>

      </div>
    </div>
  )
}
