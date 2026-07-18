// Отправка служебных уведомлений владельцу продукта в Telegram.
//
// Настройка (один раз):
//  1. Написать @BotFather → /newbot → получить токен
//  2. Написать своему боту любое сообщение
//  3. Открыть https://api.telegram.org/bot<ТОКЕН>/getUpdates → взять result[0].message.chat.id
//  4. Добавить TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env.local и в Vercel
//
// Если переменные не заданы — отправка тихо пропускается (нет крашей на dev).

export async function sendTelegramMessage(text: string): Promise<{ ok: boolean; error?: string }> {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы — сообщение не отправлено')
    return { ok: false, error: 'not configured' }
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[telegram] sendMessage failed:', res.status, body)
      return { ok: false, error: `${res.status} ${body}` }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[telegram] network error:', msg)
    return { ok: false, error: msg }
  }
}
