import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'

interface Props {
  expiresAt: Date
  appUrl: string
}

export default function SubscriptionExpiringEmail({ expiresAt, appUrl }: Props) {
  const dateStr = expiresAt.toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <Html lang="ru">
      <Head />
      <Preview>Ваша подписка Tournable Pro истекает через 3 дня — {dateStr}</Preview>
      <Body style={body}>
        <Container style={container}>

          <Section style={logoSection}>
            <Text style={logoText}>TOURNABLE</Text>
          </Section>

          <Section style={contentSection}>
            <Section style={warningBadge}>
              <Text style={warningBadgeText}>Подписка истекает</Text>
            </Section>

            <Heading style={h1}>Ваш Pro-план заканчивается</Heading>

            <Text style={paragraph}>
              <strong>{dateStr}</strong> — последний день действия вашей подписки Tournable Pro.
              После этого аккаунт перейдёт на бесплатный план.
            </Text>

            <Section style={featuresList}>
              <Text style={featuresTitle}>Что вы потеряете:</Text>
              <Text style={featureItem}>— Создание более 3 турниров</Text>
              <Text style={featureItem}>— Форматы «Лига + Плей-офф» и «Группы + Плей-офф»</Text>
              <Text style={featureItem}>— LIVE-режим ведения матчей</Text>
              <Text style={featureItem}>— Экспорт таблиц и отчётов</Text>
              <Text style={featureItem}>— Приглашение редакторов</Text>
            </Section>

            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button href={`${appUrl}/checkout`} style={button}>
                Продлить подписку
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Управление подпиской доступно в{' '}
            <a href={`${appUrl}/account`} style={link}>настройках аккаунта</a>.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#fffbeb',
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

const contentSection: React.CSSProperties = {
  padding: '40px',
}

const warningBadge: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fcd34d',
  borderRadius: '8px',
  padding: '6px 14px',
  display: 'inline-block',
  marginBottom: '20px',
}

const warningBadgeText: React.CSSProperties = {
  color: '#92400e',
  fontSize: '12px',
  fontWeight: '700',
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const h1: React.CSSProperties = {
  color: '#111827',
  fontSize: '22px',
  fontWeight: '900',
  margin: '0 0 16px',
}

const paragraph: React.CSSProperties = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 24px',
}

const featuresList: React.CSSProperties = {
  backgroundColor: '#fef9c3',
  border: '1px solid #fde68a',
  borderRadius: '12px',
  padding: '16px 20px',
}

const featuresTitle: React.CSSProperties = {
  color: '#78350f',
  fontSize: '13px',
  fontWeight: '700',
  margin: '0 0 10px',
}

const featureItem: React.CSSProperties = {
  color: '#78350f',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 4px',
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

const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '0 40px',
}

const footer: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '1.5',
  padding: '24px 40px 32px',
  margin: 0,
}

const link: React.CSSProperties = {
  color: '#059669',
}
