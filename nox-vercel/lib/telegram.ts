export async function sendToTelegram(text: string, photoUrl?: string) {
  if (
    process.env.TELEGRAM_ENABLED !== 'true' ||
    !process.env.TELEGRAM_BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN' ||
    !process.env.TELEGRAM_OWNER_ID
  ) {
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_OWNER_ID;

  try {
    if (photoUrl) {
      await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption: text,
          parse_mode: 'HTML',
        }),
      });
    } else {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });
    }
  } catch (e) {
    console.error('Telegram error', e);
  }
}
