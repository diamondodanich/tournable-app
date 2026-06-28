import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Img, Preview, Section, Text,
} from '@react-email/components'

interface Props {
  appUrl: string
}

export default function SubscriptionExpiredEmail({ appUrl }: Props) {
  return (
    <Html lang="ru">
      <Head />
      <Preview>Р’Р°С€Р° РїРѕРґРїРёСЃРєР° Tournable Pro РёСЃС‚РµРєР»Р° вЂ” РІР°С€Рё РґР°РЅРЅС‹Рµ РІ СЃРѕС…СЂР°РЅРЅРѕСЃС‚Рё</Preview>
      <Body style={body}>
        <Container style={container}>

          <Section style={logoSection}>
            <table align="center" cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
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
          </Section>

          <Section style={contentSection}>
            <Heading style={h1}>РџРѕРґРїРёСЃРєР° Pro РёСЃС‚РµРєР»Р°</Heading>

            <Text style={paragraph}>
              Р’Р°С€ Р°РєРєР°СѓРЅС‚ РїРµСЂРµРІРµРґС‘РЅ РЅР° Р±РµСЃРїР»Р°С‚РЅС‹Р№ РїР»Р°РЅ. Р’СЃРµ РІР°С€Рё С‚СѓСЂРЅРёСЂС‹,
              РєРѕРјР°РЅРґС‹ Рё СЂРµР·СѓР»СЊС‚Р°С‚С‹ РјР°С‚С‡РµР№ <strong>СЃРѕС…СЂР°РЅРµРЅС‹</strong> Рё РґРѕСЃС‚СѓРїРЅС‹ РґР»СЏ РїСЂРѕСЃРјРѕС‚СЂР°.
            </Text>

            <Section style={infoBox}>
              <Text style={infoTitle}>Р§С‚Рѕ РёР·РјРµРЅРёР»РѕСЃСЊ:</Text>
              <Text style={infoItem}>вЂ” РЎРѕР·РґР°РЅРёРµ РЅРѕРІС‹С… С‚СѓСЂРЅРёСЂРѕРІ РѕРіСЂР°РЅРёС‡РµРЅРѕ РґРѕ 3</Text>
              <Text style={infoItem}>вЂ” Р¤РѕСЂРјР°С‚С‹ Р›РёРіР° Рё Р“СЂСѓРїРїС‹ РЅРµРґРѕСЃС‚СѓРїРЅС‹ РґР»СЏ РЅРѕРІС‹С…</Text>
              <Text style={infoItem}>вЂ” LIVE-СЂРµР¶РёРј Рё СЌРєСЃРїРѕСЂС‚ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅС‹</Text>
            </Section>

            <Text style={paragraphSmall}>
              Р’СЃРµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёРµ С‚СѓСЂРЅРёСЂС‹ РѕСЃС‚Р°СЋС‚СЃСЏ РґРѕСЃС‚СѓРїРЅС‹РјРё вЂ” РІС‹ РјРѕР¶РµС‚Рµ
              РїСЂРѕСЃРјР°С‚СЂРёРІР°С‚СЊ Рё СЂРµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РёС… Р±РµР· РѕРіСЂР°РЅРёС‡РµРЅРёР№.
            </Text>

            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button href={`${appUrl}/checkout`} style={button}>
                Р’РѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊ Pro
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Р•СЃС‚СЊ РІРѕРїСЂРѕСЃС‹? РќР°РїРёС€РёС‚Рµ РЅР°Рј РЅР°{' '}
            <a href="mailto:info@tournable.app" style={link}>info@tournable.app</a>.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#fef2f2',
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
  margin: '0 0 16px',
}

const paragraph: React.CSSProperties = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 24px',
}

const paragraphSmall: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '16px 0 0',
}

const infoBox: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '12px',
  padding: '16px 20px',
}

const infoTitle: React.CSSProperties = {
  color: '#7f1d1d',
  fontSize: '13px',
  fontWeight: '700',
  margin: '0 0 10px',
}

const infoItem: React.CSSProperties = {
  color: '#7f1d1d',
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
