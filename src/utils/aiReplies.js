const SYSTEM_PROMPTS = {
  chat:     'You are Leamus AI, a helpful and knowledgeable assistant. Give clear, accurate, well-structured responses.',
  write:    'You are Leamus AI, an expert writer. Help with emails, blogs, stories, reports, and any writing tasks.',
  code:     'You are Leamus AI, a senior software engineer. Write clean, well-commented code with clear explanations.',
  data:     'You are Leamus AI, a data analyst. Interpret data and provide structured insights.',
  research: 'You are Leamus AI, a research assistant. Provide accurate, well-structured information.'
};

const IMAGE_STYLES = {
  photo:     'hyperrealistic photography, 8k uhd, DSLR, sharp focus, high detail, professional lighting',
  art:       'digital art, concept art, highly detailed, artstation, smooth, sharp focus',
  cinematic: 'cinematic shot, film grain, dramatic lighting, movie still, epic composition',
  portrait:  'professional portrait, studio lighting, bokeh background, sharp eyes, detailed skin texture',
  landscape: 'epic landscape, golden hour, god rays, ultra wide angle, breathtaking scenery',
  fantasy:   'fantasy art, magical atmosphere, ethereal lighting, intricate details, artstation trending',
  anime:     'anime style, studio ghibli, vibrant colors, detailed background, high quality',
  default:   'ultra detailed, high quality, 8k resolution, masterpiece, best quality, sharp focus'
};

function detectStyle(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('portrait') || p.includes('person') || p.includes('face') || p.includes('people')) return 'portrait';
  if (p.includes('landscape') || p.includes('mountain') || p.includes('nature') || p.includes('scenery')) return 'landscape';
  if (p.includes('cinematic') || p.includes('movie') || p.includes('film')) return 'cinematic';
  if (p.includes('anime') || p.includes('cartoon') || p.includes('manga')) return 'anime';
  if (p.includes('fantasy') || p.includes('magic') || p.includes('dragon')) return 'fantasy';
  if (p.includes('art') || p.includes('painting') || p.includes('illustration')) return 'art';
  if (p.includes('photo') || p.includes('realistic') || p.includes('real')) return 'photo';
  return 'default';
}

export async function getAIReply(mode, userMessage) {
  const imgTriggers = [
    'generate image', 'create image', 'make image', 'draw',
    'generate a picture', 'create a picture', 'show me an image',
    'generate photo', 'create photo', 'make a photo', 'paint',
    'illustrate', 'visualize', 'render'
  ];

  const isImageRequest = imgTriggers.some(t => userMessage.toLowerCase().includes(t));
  if (isImageRequest) return await generateImage(userMessage);
  return await getTextReply(mode, userMessage);
}

async function getTextReply(mode, userMessage) {
  const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;
  const errors = [];

  // Method 1 — POST with openai-large
  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://sandy23786.github.io'
      },
      body: JSON.stringify({
        model: 'openai-large',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text && text.trim().length > 5) return text.trim();
      errors.push('M1: empty response');
    } else {
      errors.push(`M1: HTTP ${res.status}`);
    }
  } catch (e) { errors.push(`M1: ${e.message}`); }

  // Method 2 — POST with openai (standard)
  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text && text.trim().length > 5) return text.trim();
      errors.push('M2: empty response');
    } else {
      errors.push(`M2: HTTP ${res.status}`);
    }
  } catch (e) { errors.push(`M2: ${e.message}`); }

  // Method 3 — POST with mistral
  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text && text.trim().length > 5) return text.trim();
      errors.push('M3: empty response');
    } else {
      errors.push(`M3: HTTP ${res.status}`);
    }
  } catch (e) { errors.push(`M3: ${e.message}`); }

  // Method 4 — GET request
  try {
    const encoded = encodeURIComponent(
      `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`
    );
    const res = await fetch(
      `https://text.pollinations.ai/${encoded}`,
      { method: 'GET', mode: 'cors' }
    );
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 5) return text.trim();
      errors.push('M4: empty response');
    } else {
      errors.push(`M4: HTTP ${res.status}`);
    }
  } catch (e) { errors.push(`M4: ${e.message}`); }

  // Method 5 — no-cors GET (last resort)
  try {
    const encoded = encodeURIComponent(userMessage);
    const res = await fetch(
      `https://text.pollinations.ai/${encoded}?model=openai`,
      { method: 'GET' }
    );
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 5) return text.trim();
      errors.push('M5: empty response');
    } else {
      errors.push(`M5: HTTP ${res.status}`);
    }
  } catch (e) { errors.push(`M5: ${e.message}`); }

  // Return the actual errors so we can see what's failing
  return `Debug info — all methods failed:\n${errors.join('\n')}\n\nPlease share this message so we can fix the issue.`;
}

async function generateImage(userMessage) {
  const rawPrompt = userMessage
    .replace(/generate image of|create image of|make image of|draw a|draw an|draw|generate a picture of|create a picture of|show me an image of|generate photo of|create photo of|make a photo of|paint a|paint an|paint|illustrate|visualize|render/gi, '')
    .trim();

  const style = detectStyle(rawPrompt);
  const styleKeywords = IMAGE_STYLES[style];
  const enhancedPrompt = `${rawPrompt}, ${styleKeywords}, vibrant colors, rich textures, perfect composition`;
  const encodedPrompt = encodeURIComponent(enhancedPrompt);
  const seed = Math.floor(Math.random() * 99999999);

  const variations = [
    { label: 'Standard',    url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${seed}&model=flux&nologo=true&enhance=true` },
    { label: 'Variation 2', url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${seed+1}&model=flux&nologo=true&enhance=true` },
    { label: 'Variation 3', url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${seed+2}&model=flux&nologo=true&enhance=true` },
    { label: 'Square',      url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed+3}&model=flux&nologo=true&enhance=true` }
  ];

  return `__IMAGE_RESULT__${JSON.stringify({ prompt: rawPrompt, enhancedPrompt, style, variations })}`;
}
