const API_KEY = 'AIzaSyD86J7ODFVr-japDRk89QvYxWEg2GM-qj0';

export async function getAIReply(mode, userMessage) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userMessage }] }]
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return 'API said: ' + JSON.stringify(data);
    }

  } catch (error) {
    return 'Fetch failed: ' + error.message;
  }
}
