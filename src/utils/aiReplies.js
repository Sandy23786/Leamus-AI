const API_KEY = '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';

const SYSTEM_PROMPTS = {
  chat:     'You are Leamus AI, a helpful assistant. Be concise and clear.',
  write:    'You are Leamus AI, an expert writer. Help with emails, blogs, stories, and writing tasks.',
  code:     'You are Leamus AI, a senior software engineer. Write clean code with explanations.',
  data:     'You are Leamus AI, a data analyst. Interpret data and provide structured insights.',
  research: 'You are Leamus AI, a research assistant. Provide accurate, well-structured information.'
};

export async function getAIReply(mode, userMessage) {
  try {
    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;
    const fullPrompt = systemPrompt + '\n\nUser: ' + userMessage + '\n\nAssistant:';

    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + API_KEY
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            return_full_text: false
          }
        })
      }
    );

    const data = await response.json();

    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text.trim();
    } else if (data.error) {
      return 'API Error: ' + data.error;
    } else {
      return 'API said: ' + JSON.stringify(data);
    }

  } catch (error) {
    return 'Error: ' + error.message;
  }
}
