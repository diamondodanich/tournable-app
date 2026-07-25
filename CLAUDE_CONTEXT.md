# Tournable — Project Context for Claude

This file is auto-loaded via CLAUDE.md. It gives Claude full project context on any machine.

---

## Stack & Deployment
Next.js 15 (App Router) + Supabase + TypeScript + Tailwind CSS. Deployed on Vercel.
GitHub repo: **diamondodanich/tournable-app** — main branch → auto-deploy via Vercel.
Live URL: **https://tournable.app**

shadcn/ui uses **base-ui variant** — NEVER use `asChild` on Button/DropdownMenuItem.
Auth middleware: `src/proxy.ts` (not middleware.ts), export named `proxy`.
Tabs use `data-active` attribute (NOT `data-state="active"`). Active tab: `data-[active]:bg-[var(--sp)] data-[active]:text-white`.

## Business Model
- **Free**: 1 активный турнир, 16 команд, без Pro-фич
- **Pro**: 4 990 ₸/мес · 44 990 ₸/год — безлимит, Live-табло, экспорт PDF, все форматы, до 3 со-редакторов
- Оплата: FreedomPay (MID: 586535, тестовый режим)

## ИП реквизиты
ИП Асқар Данияр Тахирұлы, ИИН: 030830501207
Адрес: РК, г. Астана, р-н Алматы, ул. Кайрата Рыскулбекова, 29А

## DB Tables (Supabase)
- `tournaments` — format, sport, match_periods, extra_time, match_duration_mins, points_win/draw/loss, groups_count, teams_advance, deleted_at (soft delete)
- `teams` — group_name, logo_url
- `fixtures` — matchday, scores, played, is_bye, match_events(*)
- `match_events` — fixture_id | playoff_match_id, team_id, type: goal|own_goal|assist|yellow_card|red_card, minute, player_name
- `playoff_matches` — round_order, match_order, winner_id, winner_to_match, winner_slot
- `live_games` — realtime scoreboard state
- `tournament_members` — role: editor|viewer, invite_token
- `profiles` — plan: free|pro, plan_expires_at, is_admin
- `subscriptions` — user_id, plan, expires_at, amount_kzt, source: freedompay|manual, external_id

## Tournament Formats
`round_robin` | `playoff` | `groups_playoff` | `league_playoff`
- groups_playoff: serpentine seeding, group_name per team, cross-group matchdays
- league_playoff: N-1 matchdays default, teamsAdvance must < totalTeams

## Key Files
- `src/lib/i18n.ts` — translation dictionary ru/kz/en; exports `tx`, `getLang`, `TournamentTx`
- `src/lib/sports.ts` — `getSportTheme(sport)`, `getSubtype()`
- `src/components/tournament/` — TournamentHeader, FixturesTab, PlayoffTab, StandingsTable, StandingsTab, GroupStandingsTab, StatsTab, ChampionBanner, SharePanel, ExportReportButton
- `src/components/live/LiveBoard.tsx` — realtime scoreboard (Supabase realtime)
- `src/components/ui/SportIcon.tsx` — SoccerBallIcon (custom SVG), AssistIcon
- `src/components/icons/sport-icons.tsx` — SoccerBall, BasketballBall, HockeyPuck (full realistic SVGs)
- `src/components/landing/SupportWidget.tsx` — chatbot, keyword matching, 3-language FAQ, text input
- `src/app/(dashboard)/dashboard/tournament/[id]/page.tsx` — main tournament page (Server Component, reads lang cookie)
- `src/app/actions/billing.ts` — getUserPlan(), getOwnerPlan(tournamentId), adminSetPlan(), cancelSubscription()
- `src/app/actions/payments.ts` — getPaymentOrderParams(period, planType, provider), getPaymentOrderStatus(orderId)
- `src/components/checkout/CardPaymentForm.tsx` — FreedomPay JS SDK integration
- `.claude/scripts/auto-deploy.sh` — CI/CD pipeline (TS check → commit → push → merge main → Vercel)

## i18n System
All tournament UI text translated via `src/lib/i18n.ts`.
- `Lang` type: `'ru' | 'kz' | 'en'`
- Cookie: `lang` (read server-side in page.tsx via `cookies()`)
- Pattern: page.tsx reads lang cookie → passes `lang` prop to all child components → each computes `const T = tx[lang]`
- `TournamentTx = typeof ru` — used for prop typing in child components

## Component Patterns

**Server vs Client Components:**
- `page.tsx` = Server Component — use `cookies()`, `createClient()`, `await` directly
- Client Components receive `lang?: Lang` prop (default 'ru'), compute `const T = tx[lang]` inside
- Never read cookies in Client Components

**StatsTab icon pattern:**
- Uses `renderIcon: (size, className) => React.ReactNode` render functions (not `React.ElementType`)
- Allows passing `sport` context to GoalIcon without React component identity issues
- SoccerBall for: football, futsal, efootball
- BasketballBall for: basketball, streetball, ebasketball

**Supabase client:**
- Server Components: `import { createClient } from '@/lib/supabase/server'` → `const supabase = await createClient()`
- Client Components: `import { createClient } from '@/lib/supabase/client'`

## Sports Taxonomy
Values in `tournaments.sport` column:
- Football family: `football`, `futsal`, `efootball`
- Basketball family: `basketball`, `streetball`, `ebasketball`
- Other: `volleyball`, `beach_volleyball`, `hockey`, `other`
- `--sp` CSS variable = sport primary color (set in tournament page)

## TipTop Pay (active payment provider — CloudPayments-compatible, white-label for KZ)
- Live checkout (`CheckoutForm.tsx`, `EnterpriseCheckoutForm.tsx`) uses `TipTopPayButton.tsx`, NOT `CardPaymentForm.tsx` (FreedomPay — kept in repo unused, not deleted)
- `src/lib/tiptoppay.ts` — client-safe: Public ID, prices, types ONLY (no Node imports — TipTopPayButton imports from it). `verifyWebhookSignature()` + API_SECRET live inside the webhook route
- Keys verified working (2026-07-02, API /test → Success:true). Public ID is genuinely 29 chars after pk_ (TipTop format); secret is 32 chars (was truncated by 1 char on first copy — watch for this)
- Webhook verified locally end-to-end (2026-07-02): valid HMAC + Status=Completed → parses Data metadata → hits Supabase step; invalid HMAC → "signature mismatch"; Status other than Completed/Authorized (e.g. Declined) → ignored. Always acks {"code":0}
- ЛК notification toggles: enable ONLY Pay → https://tournable.app/api/webhooks/tiptoppay. Do NOT enable Check/Fail/Confirm/Refund/Receipt/SbpToken/Kkt/Cancel for now; Recurrent — later when подписки wired. SSL-ignore / client cert / basic auth toggles — off
- Migration 023 applied in Supabase (2026-07-02)
- Dashboard: https://merchant.tiptoppay.kz/next/dashboard/main — Public ID + API Secret (test terminal) live in `.env.local` as `NEXT_PUBLIC_TIPTOPPAY_PUBLIC_ID` / `TIPTOPPAY_API_SECRET` (add to Vercel env for prod)
- Widget script: `https://widget.tiptoppay.kz/bundles/widget.js` → global `window.tiptop.Widget` (verified in browser: also exposes `window.cp` — same lib, `tiptop` alias)
- Flow: `new tiptop.Widget()` → `widget.start({ publicTerminalId, amount, currency, externalId, paymentSchema, userInfo: { accountId, email }, metadata, ... })` → `widget.oncomplete = (result) => {...}` (result.status: success/fail/reject/cancel). **`accountId`/`email` must be nested under `userInfo`** — passing them top-level is silently ignored (confirmed against the official param reference, not just CloudPayments docs)
- `metadata` (user_id, plan_period, plan_type) round-trips back in the webhook as a `Data` JSON field — same pattern as FreedomPay's `custom_params`
- Webhook: `src/app/api/webhooks/tiptoppay/route.ts` — verifies `Content-HMAC`/`X-Content-HMAC` header (`HMAC-SHA256(rawBody, ApiSecret)`, UTF8, base64), responds `{"code":0}` — field names (`TransactionId`, `AccountId`, `InvoiceId`, `SubscriptionId`, `Data`) and response format confirmed word-for-word against the official TipTop Pay doc (2026-07-01), not inferred from CloudPayments
- Subscriptions `source` value: `'cloudpayments'` (already allowed by the original 011 migration's check constraint — no new constraint needed)
- RPC: `record_cloudpayments_subscription` (migration 023) — mirrors `record_freedompay_subscription`, used by `activateProAfterPayment`/`activateEnterpriseAfterPayment` when called with `source: 'cloudpayments'`
- Recurring payments WIRED but CURRENTLY UNUSED (2026-07-02): widget passes `recurrent: { interval: 'Month', period: 1|12 }` + `userInfo.accountId` (обязателен для рекуррента). Code kept intact for future reactivation — see "Recurring payments — currently disabled" section below for why
- Recurring charges may arrive without Data metadata → webhook falls back to amount→plan mapping (4990/44990/39990/349990 are pairwise distinct). SubscriptionId stored in subscriptions.subscription_id (migration 024 — НЕ применена, выполнить в Supabase!)
- `cancelSubscription()` (billing.ts): cancels via POST api.tiptoppay.kz/subscriptions/cancel (Basic auth PublicId:ApiSecret), access stays until plan_expires_at (cron downgrades); fallback для ручных выдач — немедленный free
- Terms 4.2/4.2.1/4.2.2 updated for auto-renewal (было «продление самостоятельно» — БЫЛО НЕВЕРНО для рекуррента)
- ЛК Recurrent toggle: можно не включать — webhook игнорирует не-Completed статусы; подписка живёт через Pay-уведомления, отмена — через наш API-вызов
- Onboarding sequence per TipTop manager: анкета → сбор 6 000 ₸ (оферта says 6 000, manager quoted 20 000 — clarify) → банк Береке выдаёт онлайн-терминал (согласие ИП на сбор/обработку данных отправлено) → полная готовность
- Foreign-issued cards: first 2 months KZ-only, then TipTop opens international payments (fixed timeline per manager) — check status ~2 months after go-live. FreedomPay's equivalent condition ("confirm stable turnover") is vague/bank-discretion — one of the reasons we stayed on TipTop over FreedomPay's slightly lower 3.6% vs 3.9% commission (2026-07-02 comparison: switching cost + FreedomPay's own prod token still pending outweighed the ~0.3% commission delta at our volume)

## FreedomPay JS SDK (АКТИВНЫЙ провайдер — боевой режим с 2026-07-24)
- MID: 586535. Аккаунт переведён в боевой режим менеджером 2026-07-24; JS SDK токен при переводе НЕ изменился (тот же `OEusiPqD…`), сменился только режим — не пугаться, что значение совпадает с «тестовым»
- Ключи живут в `.env.local` / Vercel: `NEXT_PUBLIC_FREEDOMPAY_WIDGET_TOKEN`, `FREEDOMPAY_MERCHANT_ID`, `FREEDOMPAY_SECRET_KEY` («секретный для приема»), `FREEDOMPAY_WIDGET_SECRET` («секретный для виджета»). Смотреть в кабинете: my.freedompay.kz/dev → «Стандартные ключи»
- Кабинет выдаёт ДВА ключа приёма (приём + виджет) и не документирует, каким подписывается колбэк JS SDK → webhook проверяет подпись против обоих и отвечает тем же ключом, которым пришло (`signingKey` в `route.ts`)
- `CARD_PAYMENTS_ENABLED` в `CardPaymentForm.tsx` — рубильник приёма карт. `true` с 2026-07-24; поставить `false` вернёт чекаут на оплату через менеджера (WhatsApp) без правки логики
- Публичный ключ пары js sdk захардкожен в `CardPaymentForm.tsx` — сверен с боевым 2026-07-24, совпадает
- SDK: `https://cdn.freedompay.kz/sdk/js-sdk-1.0.0.js`
- Flow: `SDK.setup(publicKey, token)` → `SDK.charge(payment, transaction)` → if `need_confirm`: `SDK.confirmInIframe(result, containerId)`
- FreedomPay does NOT support recurring payments — one-time only
- Webhook signature: `MD5(scriptName + ';' + sorted_param_values_by_key + ';' + secretKey)`
- Ключ выплат (`Секретный ключ для выплат`) в код НЕ заводим — выплат в продукте нет

## Активация платного плана — только через webhook (2026-07-25)
ПРАВИЛО: клиент НИКОГДА не выдаёт план. Единственный код, который пишет `profiles.plan`, — `src/app/api/webhooks/freedompay/route.ts` (service_role, после проверки MD5-подписи). Раньше это делал server action `activateProAfterPayment`, вызываемый из браузера после ответа SDK, — любой залогиненный пользователь мог дёрнуть его напрямую и получить Pro бесплатно. Оба `activate*AfterPayment` УДАЛЕНЫ, не возвращать.

**Миграция 043 — таблица `profiles` закрыта на запись.** В ней нет пользовательских полей: имя/телефон/страна/город лежат в `auth.users.user_metadata` (`updateAccountProfile` в actions/auth.ts), а в таблице только `plan`, `plan_expires_at`, `is_admin`, `is_internal`. Политика из 010 (`for all using auth.uid() = id`) позволяла любому пользователю прямо из браузера выдать себе бессрочный Pro и `is_admin = true`, минуя server actions. Теперь у `authenticated` только SELECT своей строки; писать могут service_role и две SECURITY DEFINER функции:
- `admin_grant_plan(p_user_id, p_plan, p_months, p_amount_kzt)` (миграция 044, заменила `admin_set_plan` из 043) — проверяет `is_admin` вызывающего внутри БД, меняет план ЛЮБОМУ пользователю, продлевает от текущей даты окончания как webhook. При заданном `p_amount_kzt` пишет строку в `subscriptions` с `source='manual'` — без неё продажи через WhatsApp не попадут в MRR (он считается по `subscriptions.amount_kzt`). Обёртка — `adminGrantPlan()` в billing.ts. Заменила `activatePro`/`activateEnterprise`: у первой проверки прав не было вовсе, вторая проверяла в коде, но всё равно не могла записать чужую строку из-за RLS
- UI выдачи: `src/components/admin/UserPlanCell.tsx` — выпадающий список в колонке «План» таблицы «Последние регистрации» на `/admin/metrics`. Суммы продублированы в компоненте намеренно: `lib/freedompay.ts` тянет `node:crypto` и в клиентский бандл не годится. Переключатель на `/account` (`AdminPlanButton`) выдаёт бессрочно и без записи платежа — он для проверки на своём аккаунте
- `downgrade_own_plan()` — понижение самому себе, прав не требует, используется в `cancelSubscription`
НЕ добавлять RLS-политику на UPDATE для `authenticated` — это вернёт дыру.
- Миграция `039_payment_orders.sql` — таблица `payment_orders`. RLS: владелец может SELECT свои и INSERT только со `status='pending'`; политик UPDATE/DELETE нет намеренно → статус `paid` неподделываем из браузера (миграция 018 раздаёт права будущим таблицам по умолчанию, поэтому в 039 стоит явный `revoke`)
- Поток: `getPaymentOrderParams()` пишет заказ `pending` ДО оплаты → SDK платит → редирект на `/checkout/success?order=<id>` → страница показывает `PaymentPending.tsx` (поллинг `getPaymentOrderStatus` раз в 2 с, таймаут 90 с → экран «Оплата обрабатывается» + номер заказа + WhatsApp) → webhook переводит заказ в `paid` и выдаёт план → `router.refresh()` показывает успех
- Идемпотентность: `update ... where order_id=? and status='pending'` — повторный колбэк не вернёт строк и план не продлится дважды
- Сумма сверяется с `PRICES`/`ENTERPRISE_PRICES` в коде, а НЕ с `amount_kzt` из заказа (строку создаёт клиентская сессия, подделанная сумма не должна открыть дешёвый Enterprise)
- Продление считается от текущего `plan_expires_at`, если он в будущем, иначе от now — оплата заранее не съедает остаток оплаченного периода
- Письмо об активации шлёт webhook; язык берётся из `payment_orders.lang` (cookie там не прочитать)
- Fail-closed: если заказ не записался, `getPaymentOrderParams` возвращает ошибку и к оплате не пускает. ⚠️ Пока миграция 039 не применена, чекаут не работает вообще — это осознанно, лучше чем брать деньги без записи

## Live Match Flow
1. Click "Начать матч" → POST /api/live/start → creates live_games row
2. LiveBoard.tsx subscribes to live_games via Supabase realtime
3. Events saved to match_events in real-time
4. Finish → saves result to fixtures, marks played=true, deletes live_game
5. Auto-close countdown 3s after finish, no beforeunload dialog

## Auto-Deploy (Stop Hook)
After every Claude session, `~/.claude/settings.json` Stop hook runs `.claude/scripts/auto-deploy.sh`:
1. TS check (`npx tsc --noEmit`) — blocks commit if errors, sends asyncRewake to Claude
2. `git add -A && git commit`
3. Push worktree branch to origin
4. Merge into main worktree → push origin main → Vercel deploys

**settings.json** (needed on every machine):
```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "bash 'C:/Users/<USERNAME>/Documents/tournable-next/.claude/scripts/auto-deploy.sh'",
        "shell": "bash",
        "timeout": 120,
        "asyncRewake": true,
        "statusMessage": "Auto CI/CD: TS check → commit → push → deploy...",
        "rewakeMessage": "Auto-CI нашёл проблему:"
      }]
    }]
  }
}
```

## Env Vars (.env.local — NOT in git)
```
NEXT_PUBLIC_SUPABASE_URL=https://ehvdvpmzpeprkuqkgzbh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVodmR2cG16cGVwcmt1cWtnemJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDAxNTYsImV4cCI6MjA5NDE3NjE1Nn0.yXVwFTXYPcxpDjAqVdx4nI_c8DH159oAh9e600lUCMI
```

Additional (in Vercel, not needed locally for basic dev):
- SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, RESEND_API_KEY, FROM_EMAIL
- NEXT_PUBLIC_APP_URL=https://tournable.app
- FREEDOMPAY_MERCHANT_ID=586535, FREEDOMPAY_SECRET_KEY, FREEDOMPAY_WIDGET_TOKEN (pending)
- TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID — ежедневный дайджест метрик (pending)

## Продуктовые метрики (2026-07-19)
- Миграция `034_product_metrics.sql` — RPC `public.product_metrics()`, SECURITY DEFINER, доступ только `profiles.is_admin` или `service_role`. Считает все метрики одним запросом, возвращает jsonb
- `/admin/metrics` (`src/app/(dashboard)/admin/metrics/page.tsx`) — админ-дашборд, мобильная сетка: привлечение / активация / возврат / использование / деньги. Не-админам отдаёт `notFound()`, ссылка — в админ-блоке `/account`
- `src/lib/metrics.ts` — тип `ProductMetrics` + `formatDigest()` (HTML для Telegram)
- `src/lib/telegram.ts` — `sendTelegramMessage()`, тихо пропускает при незаданных env
- `/api/cron/daily-digest` — Vercel Cron `0 1 * * *` (07:00 Астана), требует `SUPABASE_SERVICE_ROLE_KEY` (anon RPC не пустит)
- Vercel Analytics (`@vercel/analytics/next`) в root layout — трафик и источники переходов
- Известное ограничение: у `fixtures` нет `played_at`, поэтому `matches_played_7d` = сыграно в турнирах, созданных за 7 дней (не «сыграно за 7 дней»). Для точности нужна колонка `played_at`
- Миграция 035 — RPC `recent_users(limit_count)`, отдаёт e-mail из `auth.users` + активность. Таблица «Последние регистрации» на `/admin/metrics`
- Миграция 036 — колонка `profiles.is_internal`, исключает свои/тестовые аккаунты из ВСЕХ метрик (включая MRR: ручные выдачи Pro через админ-переключатель больше не надувают выручку). Переопределяет `product_metrics()` и `recent_users()`. Пометить тестовый аккаунт: `update profiles set is_internal = true where id = (select id from auth.users where email = '...')`
- Миграция 037 — RPC `metrics_timeseries(days)`, ряд по дням через `generate_series` (дни без событий не схлопываются), кумулятивные ряды стартуют от базы на начало периода
- `src/components/admin/MetricsChart.tsx` — SVG-график без библиотек: 2 серии (пользователи/турниры), фильтр периода 7/30/90, режим «Всего»/«За день», вид график/таблица, крестовина с тултипом. Цвета — CSS-переменные `--mc-*` в globals.css (`.metrics-chart` / `.dark .metrics-chart`), палитра прогнана через валидатор dataviz в обеих темах
- `src/components/admin/MetricsChartPanel.tsx` — клиентская обёртка, смена периода догружает данные через `supabase.rpc` без перезагрузки страницы

## Legal Pages
- `/terms` → `src/app/terms/page.tsx` — Пользовательское соглашение
- `/privacy` → `src/app/privacy/page.tsx` — Политика конфиденциальности (FreedomPay + Resend как субподрядчики)
- RegisterForm.tsx: consent text on registration (3 languages)
- CardPaymentForm.tsx: consent text on payment
- Продление РУЧНОЕ (2026-07-03): terms п.4.2 откачен на «Продление осуществляется Пользователем самостоятельно». Cron шлёт письмо за 3 дня до истечения (`sendSubscriptionExpiringEmail`, кнопка «Продлить подписку» → `/checkout`), затем downgrade на Free через `deactivate_expired_subscriptions`

## UI wording — no "Live" / no betting-adjacent terms (2026-07-03)
Removed "Live-табло"/"LIVE-режим"/"Live scoreboard" etc. across the entire UI (landing, dashboard, emails, checkout, tour, FAQ) — replaced with plain "Табло"/"Scoreboard". Reason: suspected trigger for TipTop Pay's gambling-suspicion rejection — "live" + sports + real-time score is a common in-play betting profile for AML keyword scanners. Also fixed a pre-existing CP1251-as-UTF8 mojibake bug in `src/emails/SubscriptionExpiredEmail.tsx` (entire email was unreadable garbage) while touching that file, and corrected a stale "до 3 турниров" to "до 1" (free plan limit) found in the same broken text. Search tags in SupportWidget.tsx FAQ (internal keyword matching, not displayed) still include "live"/"лайв" — intentionally left, users may still type that when searching for help.

## Recurring payments — built, tested, currently NOT used
- TipTop Pay отказал в подключении (заявка отклонена внутренней проверкой, без объяснения причины, спор из-за возврата 20 000 ₸ в процессе) — переходим на FreedomPay
- FreedomPay recurring = «безакцептные платежи» = списание БЕЗ 3D Secure (не как у TipTop — там рекуррент шёл поверх 3DS). Это осознанно отклонено (2026-07-03): при нулевом обороте и отсутствии истории антифрода риск чарджбэков/штрафов MPS, полностью ложащийся на мерчанта по их допсоглашению, не оправдан. FreedomPay terminal будет со стандартным 3DS, вручную подтверждено менеджером
- Решение сообщено FreedomPay: «клиенты продлевают подписку самостоятельно» — доп. соглашение о без-3DS терминале НЕ подписано
- Код рекуррента (TipTopPayButton.tsx `recurrent` object, `cancelSubscription()` через TipTop API, migration 024 `subscription_id`) **оставлен нетронутым** — рабочий, протестированный, просто не в проде. Реактивировать когда: (а) спор с TipTop Pay разрешится в нашу пользу, или (б) найдётся провайдер с рекуррентом поверх 3DS (индустриальный стандарт — MIT-исключение из аутентификации, так и должно быть в норме)

## Pending Tasks (as of 2026-07-03)
0. СРОЧНО: применить миграцию `039_payment_orders.sql` в Supabase SQL Editor. До этого чекаут отдаёт «Не удалось создать заказ» и оплата картой не работает (fail-closed by design)
1. FreedomPay (2026-07-24): боевые ключи получены, прописаны в `.env.local`, `CARD_PAYMENTS_ENABLED = true`. ОСТАЛОСЬ: (а) добавить `FREEDOMPAY_MERCHANT_ID` / `FREEDOMPAY_SECRET_KEY` / `FREEDOMPAY_WIDGET_SECRET` / `NEXT_PUBLIC_FREEDOMPAY_WIDGET_TOKEN` в Vercel env; (б) прописать в кабинете FreedomPay result_url `https://tournable.app/api/webhooks/freedompay`; (в) провести реальный платёж на минимальную сумму и убедиться, что план активировался и запись легла в `subscriptions`; (г) уточнить у менеджера, каким из двух ключей приёма подписывается колбэк JS SDK
2. TipTop Pay: спор о возврате 20 000 ₸ за отклонённую верификацию — письмо отправлено, ссылка на ст. 389 ГК РК (договор присоединения)
3. Resend: зарегистрироваться → RESEND_API_KEY → верифицировать домен tournable.kz
4. Домен: купить tournable.kz → подключить к Vercel
5. Pricing strategy: решить модель (лимиты / полное разделение фич / гибрид)
6. Метрики (2026-07-19): применить миграцию 034 в Supabase SQL Editor (нет `DATABASE_URL` в `.env.local` — раннер не запускается); создать Telegram-бота → `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` в Vercel; включить Analytics в дашборде Vercel

## Завершено
- ИП зарегистрировано на eGov.kz: "Tournable.app", ИИН 030830501207
- TipTop Pay: тестовый терминал подключён в чекаут (`TipTopPayButton.tsx`), проверен в браузере (виджет открывается, корректный global `window.tiptop.Widget`)
- FreedomPay: код оставлен в репо, но больше не используется в чекауте (заменён TipTop Pay)

## SupportWidget
- `src/components/landing/SupportWidget.tsx`
- Keyword matching: split query → score FAQ items by word overlap → return best match
- FAQ in 3 languages, step-by-step format
- WA contact: https://wa.me/message/YHLE2IFII4MSJ1
