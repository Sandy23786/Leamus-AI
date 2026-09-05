const ANTHROPIC_KEY = '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';

const SYSTEM_PROMPTS = {
  chat:     'You are Leamus AI, a helpful and knowledgeable assistant. Give clear, accurate, well-structured responses.',
  write:    'You are Leamus AI, an expert writer. Help with emails, blogs, stories, reports, and any writing tasks. Produce polished, professional content.',
  code:     'You are Leamus AI, a senior software engineer. Write clean, well-commented code with clear explanations. Support all major programming languages.',
  data:     'You are Leamus AI, a data analyst. Interpret data, identify trends, and provide structured insights with bullet points and summaries.',
  research: 'You are Leamus AI, a research assistant. Provide accurate, well-structured, and detailed information with clear sections.'
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

  const msgLower = userMessage.toLowerCase();
  const isImageRequest = imgTriggers.some(t => msgLower.includes(t));

  if (isImageRequest) return await generateImage(userMessage);
  return await getTextReply(mode, userMessage);
}

async function getTextReply(mode, userMessage) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
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

    if (data.content && data.content[0]?.text) {
      return data.content[0].text;
    } else if (data.error) {
      console.error('Anthropic error:', data.error);
      return `API Error: ${data.error.message}`;
    }
    return 'Sorry, I could not get a response. Please try again.';

  } catch (error) {
    console.error('Fetch error:', error);
    return 'Connection error. Please check your internet and try again.';
  }
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
    { label: 'Standard', url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${seed}&model=flux&nologo=true&enhance=true` },
    { label: 'Variation 2', url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${seed+1}&model=flux&nologo=true&enhance=true` },
    { label: 'Variation 3', url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${seed+2}&model=flux&nologo=true&enhance=true` },
    { label: 'Square', url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed+3}&model=flux&nologo=true&enhance=true` }
  ];

  return `__IMAGE_RESULT__${JSON.stringify({ prompt: rawPrompt, enhancedPrompt, style, variations })}`;
}
