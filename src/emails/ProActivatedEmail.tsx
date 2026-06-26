import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'

interface Props {
  email:     string
  expiresAt: Date
  appUrl:    string
  period:    'monthly' | 'annual'
  amount:    number
}

export default function ProActivatedEmail({ email, expiresAt, appUrl, period, amount }: Props) {
  const periodLabel = period === 'annual' ? 'год' : 'месяц'
  const expiresStr  = expiresAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Html lang="ru">
      <Head />
      <Preview>Tournable Pro активирован — все возможности разблокированы</Preview>
      <Body style={body}>
        <Container style={container}>

          <Section style={header}>
            <Text style={headerBadge}>PRO</Text>
            <Text style={headerTitle}>TOURNABLE</Text>
          </Section>

          <Section style={heroSection}>
            <Heading style={h1}>Pro активирован</Heading>
            <Text style={paragraph}>
              Оплата прошла. Все Pro-возможности уже доступны в вашем аккаунте.
            </Text>
          </Section>

          <Section style={receiptSection}>
            <ReceiptRow label="Тариф" value={`Tournable Pro — ${periodLabel}`} />
            <ReceiptRow label="Сумма" value={`${amount.toLocaleString('ru-RU')} ₸`} />
            <ReceiptRow label="Аккаунт" value={email} />
            <ReceiptRow label="Действует до" value={expiresStr} last />
          </Section>

          <Section style={{ textAlign: 'center', padding: '24px 40px 0' }}>
            <Button href={`${appUrl}/dashboard/new`} style={button}>
              Создать турнир
            </Button>
          </Section>

          <Section style={featuresSection}>
            <FeatureRow icon="01" title="Безлимитные турниры" desc="Проводите любое количество турниров без ограничений." />
            <FeatureRow icon="02" title="До 64 команд" desc="Большие лиги, групповые этапы, полноценные чемпионаты." />
            <FeatureRow icon="03" title="Live-табло" desc="Счёт в реальном времени по ссылке — без приложений." />
            <FeatureRow icon="04" title="PDF и PNG экспорт" desc="Сетки и таблицы одним кликом для чата или печати." />
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Вы получили это письмо, потому что оформили подписку на{' '}
            <a href={appUrl} style={link}>tournable.app</a>.
            По вопросам — напишите в WhatsApp: +7 706 409-20-21.
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

function FeatureRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <Section style={featureRow}>
      <Text style={featureIcon}>{icon}</Text>
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
  background: 'linear-gradient(135deg, #047857, #10b981)',
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

const headerTitle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '900',
  letterSpacing: '-0.03em',
  margin: 0,
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
  backgroundColor: '#059669',
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
  backgroundColor: '#ecfdf5',
  color: '#059669',
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
