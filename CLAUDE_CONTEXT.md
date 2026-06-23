# Tournable — Project Context for Claude

This file is auto-loaded via CLAUDE.md. It gives Claude full project context on any machine.

---

## Stack & Deployment
Next.js 15 (App Router) + Supabase + TypeScript + Tailwind CSS. Deployed on Vercel.
GitHub repo: **diamondodanich/tournable-app** — main branch → auto-deploy via Vercel.
Live URL: **https://tournable-app.vercel.app**

shadcn/ui uses **base-ui variant** — NEVER use `asChild` on Button/DropdownMenuItem.
Auth middleware: `src/proxy.ts` (not middleware.ts), export named `proxy`.
Tabs use `data-active` attribute (NOT `data-state="active"`). Active tab: `data-[active]:bg-[var(--sp)] data-[active]:text-white`.

## Business Model
- **Free**: 3 активных турнира, 16 команд, без Pro-фич
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
- `src/app/actions/billing.ts` — getUserPlan(), getOwnerPlan(tournamentId), activatePro()
- `src/app/actions/payments.ts` — getPaymentOrderParams(period), activateProAfterPayment(period, paymentId)
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

## FreedomPay JS SDK
- MID: 586535, test token: `OEusiPqD0YsZeBZbCcxqkB4QlLBIxbVP`
- SDK: `https://cdn.freedompay.kz/sdk/js-sdk-1.0.0.js`
- Flow: `SDK.setup(publicKey, token)` → `SDK.charge(payment, transaction)` → if `need_confirm`: `SDK.confirmInIframe(result, containerId)`
- FreedomPay does NOT support recurring payments — one-time only
- Webhook signature: `MD5(scriptName + ';' + sorted_param_values_by_key + ';' + secretKey)`
- For recurring payments: migrate to CloudPayments (zaявка отправлена 2026-06-23, ожидаем ответа)

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
- NEXT_PUBLIC_APP_URL=https://tournable-app.vercel.app
- FREEDOMPAY_MERCHANT_ID=586535, FREEDOMPAY_SECRET_KEY, FREEDOMPAY_WIDGET_TOKEN (pending)

## Legal Pages
- `/terms` → `src/app/terms/page.tsx` — Пользовательское соглашение
- `/privacy` → `src/app/privacy/page.tsx` — Политика конфиденциальности (FreedomPay + Resend как субподрядчики)
- RegisterForm.tsx: consent text on registration (3 languages)
- CardPaymentForm.tsx: consent text on payment
- No auto-renewal: after expiry, cron immediately sets plan to Free

## Pending Tasks (as of 2026-06-23)
1. FreedomPay production: подписать анкету → получить выписку → отправить 5 документов → боевой token (7–10 дней)
2. CloudPayments: ждать ответа по заявке → интегрировать рекуррент
3. Resend: зарегистрироваться → RESEND_API_KEY → верифицировать домен tournable.kz
4. Домен: купить tournable.kz → подключить к Vercel
5. ИП: зарегистрировать на eGov.kz
6. Pricing strategy: решить модель (лимиты / полное разделение фич / гибрид)

## SupportWidget
- `src/components/landing/SupportWidget.tsx`
- Keyword matching: split query → score FAQ items by word overlap → return best match
- FAQ in 3 languages, step-by-step format
- WA contact: https://wa.me/message/YHLE2IFII4MSJ1
