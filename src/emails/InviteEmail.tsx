import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'

interface Props {
  tournamentName: string
  inviteUrl: string
  role: 'editor' | 'viewer'
  appUrl: string
}

export default function InviteEmail({ tournamentName, inviteUrl, role, appUrl }: Props) {
  const roleLabel = role === 'editor' ? 'редактора' : 'наблюдателя'
  const roleDesc  = role === 'editor'
    ? 'Вы сможете вводить результаты матчей и управлять расписанием.'
    : 'Вы сможете просматривать таблицу, результаты и статистику в реальном времени.'

  return (
    <Html lang="ru">
      <Head />
      <Preview>Вас приглашают в турнир «{tournamentName}»</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Logo */}
          <Section style={logoSection}>
            <Text style={logoText}>TOURNABLE</Text>
          </Section>

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={h1}>Вас приглашают в турнир</Heading>

            <Section style={tournamentBadge}>
              <Text style={tournamentBadgeText}>{tournamentName}</Text>
            </Section>

            <Text style={paragraph}>
              Вы получили роль <strong>{roleLabel}</strong>. {roleDesc}
            </Text>

            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button href={inviteUrl} style={button}>
                Принять приглашение
              </Button>
            </Section>

            <Text style={hint}>
              Кнопка не работает? Скопируйте ссылку вручную:
            </Text>
            <Text style={linkBox}>{inviteUrl}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Если вы не ожидали этого письма — просто проигнорируйте его.
            Ссылка одноразовая и потребует входа в аккаунт{' '}
            <a href={appUrl} style={link}>Tournable</a>.
          </Text>
        </Container>
      </Body>
    </Html>
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

const h1: React.CSSProperties = {
  color: '#111827',
  fontSize: '22px',
  fontWeight: '900',
  margin: '0 0 20px',
}

const tournamentBadge: React.CSSProperties = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '12px',
  padding: '14px 20px',
  marginBottom: '20px',
}

const tournamentBadgeText: React.CSSProperties = {
  color: '#065f46',
  fontSize: '16px',
  fontWeight: '800',
  margin: 0,
  textAlign: 'center',
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

const hint: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0 0 6px',
}

const linkBox: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  color: '#6b7280',
  fontSize: '11px',
  fontFamily: 'monospace',
  padding: '10px 14px',
  wordBreak: 'break-all',
  margin: 0,
}

const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '0 40px 0',
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
