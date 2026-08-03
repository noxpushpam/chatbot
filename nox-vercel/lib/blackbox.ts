export async function askBlackboxAI(userMessage: string): Promise<string> {
  if (
    process.env.BLACKBOX_ENABLED !== 'true' ||
    !process.env.BLACKBOX_API_KEY ||
    process.env.BLACKBOX_API_KEY === 'YOUR_BLACKBOX_API_KEY'
  ) {
    return '⚠️ BlackboxAI API key set nahi hai. .env mein daalo.';
  }

  try {
    const res = await fetch('https://api.blackbox.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.BLACKBOX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'blackboxai/openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are Nox AI, a helpful assistant inside a chat app called Nox. Give short, clear, useful answers. Reply in the same language the user is using (Hindi/English/Hinglish).',
          },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      return '❌ AI se reply nahi aa paya. Thodi der baad try karo.';
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '❌ Empty response from AI.';
  } catch (e) {
    console.error('Blackbox error', e);
    return '❌ AI service error.';
  }
}
