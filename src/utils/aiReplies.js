const API_KEY = 'AIzaSyA1ytzgM8nqlk89FI7hQo4R5Xy-2S1-4gQ';

const SYSTEM_PROMPTS = {
  chat:     'You are Leamus AI, a helpful assistant. Be concise and clear.',
  write:    'You are Leamus AI, an expert writer. Help with emails, blogs, stories, and any writing tasks.',
  code:     'You are Leamus AI, a senior software engineer. Write clean, well-commented code with explanations.',
  data:     'You are Leamus AI, a data analyst. Interpret data and provide structured insights with bullet points.',
  research: 'You are Leamus AI, a research assistant. Provide accurate, well-structured and detailed information.'
};

export async function getAIReply(mode, userMessage) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userMessage }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7
          }
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return 'Sorry, I could not get a response. Please try again.';
    }

  } catch (error) {
    return 'Sorry, I could not connect to the AI. Please check your API key and try again.';
  }
}
