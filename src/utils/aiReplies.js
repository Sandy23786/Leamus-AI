const SYSTEM_PROMPTS = {
  chat:     'You are Leamus AI, a helpful assistant. Be concise and clear.',
  write:    'You are Leamus AI, an expert writer. Help with emails, blogs, stories, and writing tasks.',
  code:     'You are Leamus AI, a senior software engineer. Write clean code with explanations.',
  data:     'You are Leamus AI, a data analyst. Interpret data and provide structured insights.',
  research: 'You are Leamus AI, a research assistant. Provide accurate, well-structured information.'
};

const IMAGE_STYLES = {
  photo:      'hyperrealistic photography, 8k uhd, DSLR, sharp focus, high detail, professional lighting',
  art:        'digital art, concept art, highly detailed, artstation, deviantart, smooth, sharp focus',
  cinematic:  'cinematic shot, film grain, anamorphic lens, dramatic lighting, movie still, epic composition',
  portrait:   'professional portrait, studio lighting, bokeh background, sharp eyes, detailed skin texture',
  landscape:  'epic landscape, golden hour, god rays, detailed environment, ultra wide angle, breathtaking',
  fantasy:    'fantasy art, magical atmosphere, ethereal lighting, intricate details, artstation trending',
  anime:      'anime style, studio ghibli, vibrant colors, detailed background, high quality animation',
  default:    'ultra detailed, high quality, 8k resolution, masterpiece, best quality, sharp focus'
};

function detectStyle(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('portrait') || p.includes('person') || p.includes('face') || p.includes('people')) return 'portrait';
  if (p.includes('landscape') || p.includes('mountain') || p.includes('nature') || p.includes('scenery')) return 'landscape';
  if (p.includes('cinematic') || p.includes('movie') || p.includes('film') || p.includes('scene')) return 'cinematic';
  if (p.includes('anime') || p.includes('cartoon') || p.includes('manga')) return 'anime';
  if (p.includes('fantasy') || p.includes('magic') || p.includes('dragon') || p.includes('wizard')) return 'fantasy';
  if (p.includes('art') || p.includes('painting') || p.includes('illustration') || p.includes('drawing')) return 'art';
  if (p.includes('photo') || p.includes('realistic') || p.includes('real')) return 'photo';
  return 'default';
}

function buildEnhancedPrompt(userPrompt, style) {
  const styleKeywords = IMAGE_STYLES[style];
  const negativeImplicit = 'vibrant colors, rich textures, perfect composition, balanced lighting';
  return `${userPrompt}, ${styleKeywords}, ${negativeImplicit}`;
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
    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;
    const response = await fetch('https://text.pollinations.ai/openai', {
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
    const data = await response.json();
    if (data.choices && data.choices[0]) return data.choices[0].message.content;
    return 'Sorry, I could not get a response. Please try again.';
  } catch (error) {
    return 'Error: ' + error.message;
  }
}

async function generateImage(userMessage) {
  const rawPrompt = userMessage
    .replace(/generate image of|create image of|make image of|draw a|draw an|draw|generate a picture of|create a picture of|show me an image of|generate photo of|create photo of|make a photo of|paint a|paint an|paint|illustrate|visualize|render/gi, '')
    .trim();

  const style = detectStyle(rawPrompt);
  const enhancedPrompt = buildEnhancedPrompt(rawPrompt, style);
  const encodedPrompt = encodeURIComponent(enhancedPrompt);
  const seed = Math.floor(Math.random() * 99999999);

  // Generate 4 high quality variations with different seeds and models
  const variations = [
    {
      label: 'Standard',
      url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${seed}&model=flux&nologo=true&enhance=true`
    },
    {
      label: 'Variation 2',
      url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${seed+1}&model=flux&nologo=true&enhance=true`
    },
    {
      label: 'Variation 3',
      url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${seed+2}&model=flux&nologo=true&enhance=true`
    },
    {
      label: 'Square',
      url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed+3}&model=flux&nologo=true&enhance=true`
    }
  ];

  return `__IMAGE_RESULT__${JSON.stringify({
    prompt: rawPrompt,
    enhancedPrompt,
    style,
    variations
  })}`;
}
