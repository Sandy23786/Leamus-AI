const API_KEY = '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';

const SYSTEM_PROMPTS = {
  chat:     'You are Leamus AI, a helpful assistant. Be concise and clear.',
  write:    'You are Leamus AI, an expert writer. Help with emails, blogs, stories, and any writing tasks.',
  code:     'You are Leamus AI, a senior software engineer. Write clean code with explanations.',
  data:     'You are Leamus AI, a data analyst. Interpret data and provide structured insights.',
  research: 'You are Leamus AI, a research assistant. Provide accurate, well-structured information.'
};

export async function getAIReply(mode, userMessage) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY,
        'HTTP-Referer': 'https://sandy23786.github.io/Leamus-AI/',
        'X-Title': 'Leamus AI'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat },
          { role: 'user', content: userMessage }
        ]
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    } else {
      return 'API said: ' + JSON.stringify(data);
    }

  } catch (error) {
    return 'Error: ' + error.message;
  }
}
