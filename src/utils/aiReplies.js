const API_KEY = 'AIzaSyA1ytzgM8nqlk89FI7hQo4R5Xy-2S1-4gQ';

const SYSTEM_PROMPTS = {
  chat:     'You are Leamus AI, a helpful assistant. Be concise and clear.',
  write:    'You are Leamus AI, an expert writer. Help with emails, blogs, stories, and any writing tasks.',
  code:     'You are Leamus AI, a senior software engineer. Write clean code with explanations.',
  data:     'You are Leamus AI, a data analyst. Interpret data and provide structured insights.',
  research: 'You are Leamus AI, a research assistant. Provide accurate, well-structured information.'
};

export async function getAIReply(mode, userMessage) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat,
        messages: [{ role: 'user', content: userMessage }]
      })
    });
    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    return 'Sorry, I could not connect to the AI. Please check your API key and try again.';
  }
}
