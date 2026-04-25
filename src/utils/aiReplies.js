const CF_TOKEN = 'cfat_B4leO8LUZKw0QLCnz6W1t0xqqHTQJPkp6yoSviMJ8cbf12ec';
const CF_ACCOUNT_ID = '4415250ac6be7a2fd2c8e0c43dab537b';

const SYSTEM_PROMPTS = {
  chat:     'You are Leamus AI, a helpful assistant. Be concise and clear.',
  write:    'You are Leamus AI, an expert writer. Help with emails, blogs, stories, and writing tasks.',
  code:     'You are Leamus AI, a senior software engineer. Write clean code with explanations.',
  data:     'You are Leamus AI, a data analyst. Interpret data and provide structured insights.',
  research: 'You are Leamus AI, a research assistant. Provide accurate, well-structured information.'
};

export async function getAIReply(mode, userMessage) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/mistral/mistral-7b-instruct-v0.1`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + CF_TOKEN
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat },
            { role: 'user', content: userMessage }
          ]
        })
      }
    );

    const data = await response.json();

    if (data.result && data.result.response) {
      return data.result.response;
    } else {
      return 'API said: ' + JSON.stringify(data);
    }

  } catch (error) {
    return 'Error: ' + error.message;
  }
}
