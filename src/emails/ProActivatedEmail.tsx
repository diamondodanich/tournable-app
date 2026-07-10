import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Img, Preview, Section, Text,
} from '@react-email/components'

type Lang = 'ru' | 'kz' | 'en'
type PlanType = 'pro' | 'enterprise'

interface Props {
  email:     string
  expiresAt: Date
  appUrl:    string
  period:    'monthly' | 'annual'
  amount:    number
  planType?: PlanType
  lang?:     Lang
}

const LOCALE: Record<Lang, string> = { ru: 'ru-RU', kz: 'kk-KZ', en: 'en-US' }

const T = {
  ru: {
    badge:   (p: PlanType) => p === 'enterprise' ? 'ENT' : 'PRO',
    planName:(p: PlanType) => p === 'enterprise' ? 'Enterprise' : 'Pro',
    preview: (p: PlanType) => `Tournable ${p === 'enterprise' ? 'Enterprise' : 'Pro'} активирован — все возможности разблокированы`,
    h1:      (p: PlanType) => `${p === 'enterprise' ? 'Enterprise' : 'Pro'} активирован`,
    intro:   'Оплата прошла. Все возможности тарифа уже доступны в вашем аккаунте.',
    period:  (a: boolean) => a ? 'год' : 'месяц',
    rTariff: 'Тариф', rSum: 'Сумма', rAccount: 'Аккаунт', rUntil: 'Действует до',
    cta:     (p: PlanType) => p === 'enterprise' ? 'Создать чемпионат' : 'Создать турнир',
    footer:  'Вы получили это письмо, потому что оформили подписку на',
    footerTail: 'По вопросам — напишите в WhatsApp: +7 706 409-20-21.',
    features: {
      pro: [
        ['01', 'Безлимитные турниры', 'Проводите любое количество турниров без ограничений.'],
        ['02', 'До 64 команд', 'Большие лиги, групповые этапы, полноценные чемпионаты.'],
        ['03', 'Табло', 'Счёт в реальном времени по ссылке — без приложений.'],
        ['04', 'PDF и PNG экспорт', 'Сетки и таблицы одним кликом для чата или печати.'],
      ],
      enterprise: [
        ['01', 'Чемпионаты с сезонами', 'Постоянная структура с архивом всех сезонов.'],
        ['02', 'Профили команд и игроков', 'Карточки и статистика, которые сохраняются между сезонами.'],
        ['03', 'Составы к матчам', 'Стартовый состав и запасные для каждой игры.'],
        ['04', 'Углублённая аналитика', 'Расширенная статистика и публичные SEO-страницы.'],
      ],
    },
  },
  kz: {
    badge:   (p: PlanType) => p === 'enterprise' ? 'ENT' : 'PRO',
    planName:(p: PlanType) => p === 'enterprise' ? 'Enterprise' : 'Pro',
    preview: (p: PlanType) => `Tournable ${p === 'enterprise' ? 'Enterprise' : 'Pro'} белсендірілді — барлық мүмкіндіктер ашылды`,
    h1:      (p: PlanType) => `${p === 'enterprise' ? 'Enterprise' : 'Pro'} белсендірілді`,
    intro:   'Төлем өтті. Тарифтің барлық мүмкіндіктері аккаунтыңызда қолжетімді.',
    period:  (a: boolean) => a ? 'жыл' : 'ай',
    rTariff: 'Тариф', rSum: 'Сома', rAccount: 'Аккаунт', rUntil: 'Дейін жарамды',
    cta:     (p: PlanType) => p === 'enterprise' ? 'Чемпионат құру' : 'Турнир құру',
    footer:  'Бұл хатты алдыңыз, себебі сіз жазылым рәсімдедіңіз',
    footerTail: 'Сұрақтар бойынша WhatsApp: +7 706 409-20-21.',
    features: {
      pro: [
        ['01', 'Шексіз турнирлер', 'Кез келген санда турнир өткізіңіз, шектеусіз.'],
        ['02', '64 командаға дейін', 'Үлкен лигалар, топтық кезеңдер, толық чемпионаттар.'],
        ['03', 'Табло', 'Сілтеме арқылы нақты уақыттағы есеп — қосымшасыз.'],
        ['04', 'PDF және PNG экспорт', 'Кестелерді бір шертумен чатқа немесе басып шығаруға.'],
      ],
      enterprise: [
        ['01', 'Маусымдары бар чемпионаттар', 'Барлық маусым архиві бар тұрақты құрылым.'],
        ['02', 'Команда мен ойыншы профильдері', 'Маусымдар арасында сақталатын карточкалар мен статистика.'],
        ['03', 'Матч құрамдары', 'Әр ойынға негізгі құрам мен қосалқылар.'],
        ['04', 'Тереңдетілген аналитика', 'Кеңейтілген статистика және SEO-беттер.'],
      ],
    },
  },
  en: {
    badge:   (p: PlanType) => p === 'enterprise' ? 'ENT' : 'PRO',
    planName:(p: PlanType) => p === 'enterprise' ? 'Enterprise' : 'Pro',
    preview: (p: PlanType) => `Tournable ${p === 'enterprise' ? 'Enterprise' : 'Pro'} activated — everything unlocked`,
    h1:      (p: PlanType) => `${p === 'enterprise' ? 'Enterprise' : 'Pro'} activated`,
    intro:   'Payment received. All plan features are now available in your account.',
    period:  (a: boolean) => a ? 'year' : 'month',
    rTariff: 'Plan', rSum: 'Amount', rAccount: 'Account', rUntil: 'Valid until',
    cta:     (p: PlanType) => p === 'enterprise' ? 'Create championship' : 'Create tournament',
    footer:  'You received this email because you subscribed at',
    footerTail: 'Questions? Message us on WhatsApp: +7 706 409-20-21.',
    features: {
      pro: [
        ['01', 'Unlimited tournaments', 'Run any number of tournaments without limits.'],
        ['02', 'Up to 64 teams', 'Large leagues, group stages, full championships.'],
        ['03', 'Scoreboard', 'Real-time scores via a link — no apps needed.'],
        ['04', 'PDF & PNG export', 'Brackets and tables in one click for chat or print.'],
      ],
      enterprise: [
        ['01', 'Championships with seasons', 'A permanent structure with a full season archive.'],
        ['02', 'Team & player profiles', 'Cards and stats that persist across seasons.'],
        ['03', 'Match lineups', 'Starting eleven and substitutes for every game.'],
        ['04', 'Advanced analytics', 'Extended statistics and public SEO pages.'],
      ],
    },
  },
} as const

export default function ProActivatedEmail({
  email, expiresAt, appUrl, period, amount, planType = 'pro', lang = 'ru',
}: Props) {
  const tx = T[lang]
  const isEnt = planType === 'enterprise'
  const periodLabel = tx.period(period === 'annual')
  const expiresStr  = expiresAt.toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' })
  const ctaHref = isEnt ? `${appUrl}/dashboard/new?type=championship` : `${appUrl}/dashboard/new`
  const features = isEnt ? tx.features.enterprise : tx.features.pro

  const headerBg = isEnt ? 'linear-gradient(135deg, #5b21b6, #a855f7)' : 'linear-gradient(135deg, #047857, #10b981)'
  const accent   = isEnt ? '#7c3aed' : '#059669'
  const accentBg = isEnt ? '#f5f3ff' : '#ecfdf5'

  return (
    <Html lang={lang}>
      <Head />
      <Preview>{tx.preview(planType)}</Preview>
      <Body style={body}>
        <Container style={container}>

          <Section style={{ ...header, background: headerBg }}>
            <table align="center" cellPadding="0" cellSpacing="0" style={{ margin: '0 auto 8px' }}>
              <tbody>
                <tr>
                  <td style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '5px 7px 3px', verticalAlign: 'middle' }}>
                    <Img src={`${appUrl}/logo-green.png`} width={30} height={30} alt="Tournable" style={{ display: 'block' }} />
                  </td>
                  <td style={{ paddingLeft: '10px', verticalAlign: 'middle' }}>
                    <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: 900, letterSpacing: '-0.03em', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>TOURNABLE</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <Text style={headerBadge}>{tx.badge(planType)}</Text>
          </Section>

          <Section style={heroSection}>
            <Heading style={h1}>{tx.h1(planType)}</Heading>
            <Text style={paragraph}>{tx.intro}</Text>
          </Section>

          <Section style={receiptSection}>
            <ReceiptRow label={tx.rTariff} value={`Tournable ${tx.planName(planType)} — ${periodLabel}`} />
            <ReceiptRow label={tx.rSum} value={`${amount.toLocaleString(LOCALE[lang])} ₸`} />
            <ReceiptRow label={tx.rAccount} value={email} />
            <ReceiptRow label={tx.rUntil} value={expiresStr} last />
          </Section>

          <Section style={{ textAlign: 'center', padding: '24px 40px 0' }}>
            <Button href={ctaHref} style={{ ...button, backgroundColor: accent }}>
              {tx.cta(planType)}
            </Button>
          </Section>

          <Section style={featuresSection}>
            {features.map(([icon, title, desc]) => (
              <FeatureRow key={icon} icon={icon} title={title} desc={desc} accent={accent} accentBg={accentBg} />
            ))}
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            {tx.footer}{' '}
            <a href={appUrl} style={{ ...link, color: accent }}>tournable.app</a>.
            {' '}{tx.footerTail}
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

function ReceiptRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <Section style={{ ...receiptRow, ...(last ? { borderBottom: 'none' } : {}) }}>
      <Text style={receiptLabel}>{label}</Text>
      <Text style={receiptValue}>{value}</Text>
    </Section>
  )
}

function FeatureRow({ icon, title, desc, accent, accentBg }: { icon: string; title: string; desc: string; accent: string; accentBg: string }) {
  return (
    <Section style={featureRow}>
      <Text style={{ ...featureIcon, color: accent, backgroundColor: accentBg }}>{icon}</Text>
      <Section style={featureText}>
        <Text style={featureTitle}>{title}</Text>
        <Text style={featureDesc}>{desc}</Text>
      </Section>
    </Section>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: 0,
  padding: '40px 0',
}

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  maxWidth: '560px',
  margin: '0 auto',
  overflow: 'hidden',
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
}

const header: React.CSSProperties = {
  padding: '24px 40px',
  textAlign: 'center',
}

const headerBadge: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: 'rgba(255,255,255,0.2)',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: '900',
  letterSpacing: '0.1em',
  borderRadius: '6px',
  padding: '3px 10px',
  margin: '0 0 6px',
}

const heroSection: React.CSSProperties = {
  padding: '40px 40px 0',
}

const h1: React.CSSProperties = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '900',
  lineHeight: '1.3',
  margin: '0 0 12px',
}

const paragraph: React.CSSProperties = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: 0,
}

const receiptSection: React.CSSProperties = {
  margin: '28px 40px 0',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  overflow: 'hidden',
}

const receiptRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid #f3f4f6',
}

const receiptLabel: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '13px',
  margin: 0,
}

const receiptValue: React.CSSProperties = {
  color: '#111827',
  fontSize: '13px',
  fontWeight: '700',
  margin: 0,
  textAlign: 'right',
}

const button: React.CSSProperties = {
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '700',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}

const featuresSection: React.CSSProperties = {
  padding: '28px 40px 0',
}

const featureRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px',
  marginBottom: '18px',
}

const featureIcon: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '900',
  borderRadius: '8px',
  padding: '5px 9px',
  margin: 0,
  flexShrink: 0,
}

const featureText: React.CSSProperties = {
  flex: 1,
}

const featureTitle: React.CSSProperties = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0 0 2px',
}

const featureDesc: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: 0,
}

const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '28px 40px',
}

const footer: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '1.5',
  padding: '0 40px 32px',
  margin: 0,
}

const link: React.CSSProperties = {
  color: '#059669',
}
