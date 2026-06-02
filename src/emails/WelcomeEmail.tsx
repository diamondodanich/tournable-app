import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Img, Preview, Section, Text,
} from '@react-email/components'

interface Props {
  displayName?: string
  appUrl: string
}

export default function WelcomeEmail({ displayName, appUrl }: Props) {
  const greeting = displayName ? `${displayName},` : 'Здравствуйте!'

  return (
    <Html lang="ru">
      <Head />
      <Preview>Добро пожаловать в Tournable — организуйте первый турнир прямо сейчас</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Logo / brand */}
          <Section style={logoSection}>
            <Text style={logoText}>TOURNABLE</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Heading style={h1}>Добро пожаловать, {greeting}</Heading>
            <Text style={paragraph}>
              Ваш аккаунт создан. Теперь вы можете организовывать турниры
              любого формата — от небольшого офисного кубка до полноценной лиги.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button href={`${appUrl}/dashboard/new`} style={button}>
              Создать первый турнир
            </Button>
          </Section>

          {/* Features */}
          <Section style={featuresSection}>
            <FeatureRow
              icon="01"
              title="Расписание за 30 секунд"
              desc="Выберите формат, добавьте команды — расписание генерируется автоматически."
            />
            <FeatureRow
              icon="02"
              title="Онлайн-табло"
              desc="Ведите матчи в реальном времени прямо с телефона. Участники следят по ссылке."
            />
            <FeatureRow
              icon="03"
              title="Таблицы и статистика"
              desc="Турнирная таблица, бомбардиры и события матча обновляются автоматически."
            />
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Вы получили это письмо, потому что зарегистрировались на{' '}
            <a href={appUrl} style={link}>tournable.kz</a>.
            Если это были не вы — просто проигнорируйте письмо.
          </Text>
        </Container>
      </Body>
    </Html>
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

// ── Styles ────────────────────────────────────────────────────────────────────
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
  padding: '0',
  overflow: 'hidden',
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
}

const logoSection: React.CSSProperties = {
  backgroundColor: '#059669',
  padding: '20px 40px',
  textAlign: 'center',
}

const logoText: React.CSSProperties = {
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
  margin: '0 0 16px',
}

const paragraph: React.CSSProperties = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: 0,
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
  padding: '32px 40px 0',
}

const featureRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px',
  marginBottom: '20px',
}

const featureIcon: React.CSSProperties = {
  backgroundColor: '#ecfdf5',
  color: '#059669',
  fontSize: '12px',
  fontWeight: '900',
  borderRadius: '8px',
  padding: '6px 10px',
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
  margin: '32px 40px',
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
