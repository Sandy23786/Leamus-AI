export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, systemPrompt } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            { role: 'user', parts: [{ text: message }] }
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
      return res.status(200).json({
        text: data.candidates[0].content.parts[0].text
      });
    } else {
      return res.status(200).json({ error: JSON.stringify(data) });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
