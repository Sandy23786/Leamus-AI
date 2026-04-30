const SYSTEM_PROMPTS = {
  chat:     'You are Leamus AI, a helpful assistant. Be concise and clear.',
  write:    'You are Leamus AI, an expert writer. Help with emails, blogs, stories, and writing tasks.',
  code:     'You are Leamus AI, a senior software engineer. Write clean code with explanations.',
  data:     'You are Leamus AI, a data analyst. Interpret data and provide structured insights.',
  research: 'You are Leamus AI, a research assistant. Provide accurate, well-structured information.',
  image:    'You are Leamus AI, an image generation assistant. When given a prompt, respond with ONLY a detailed, comma-separated list of descriptive keywords optimized for image generation. No other text.',
  video:    'You are Leamus AI, a video concept assistant. Create a detailed scene-by-scene description for a short video based on the prompt.'
};

export async function getAIReply(mode, userMessage) {
  // Check if user wants image generation
  const imgTriggers = ['generate image', 'create image', 'make image', 'draw', 'generate a picture', 'create a picture', 'show me an image', 'generate photo', 'create photo'];
  const vidTriggers = ['generate video', 'create video', 'make video', 'create a video', 'generate a video', 'make a video'];

  const msgLower = userMessage.toLowerCase();
  const isImageRequest = imgTriggers.some(t => msgLower.includes(t));
  const isVideoRequest = vidTriggers.some(t => msgLower.includes(t));

  if (isImageRequest) return await generateImage(userMessage);
  if (isVideoRequest) return await generateVideo(userMessage);

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
  try {
    // Clean the prompt
    const prompt = userMessage
      .replace(/generate image of|create image of|make image of|draw|generate a picture of|create a picture of|show me an image of|generate photo of|create photo of/gi, '')
      .trim();

    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);

    // Generate 3 variations
    const urls = [
      `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=512&seed=${seed}&nologo=true`,
      `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=512&seed=${seed+1}&nologo=true`,
      `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=512&seed=${seed+2}&nologo=true`
    ];

    return `__IMAGE_RESULT__${JSON.stringify({ prompt, urls })}`;
  } catch (error) {
    return 'Sorry, image generation failed. Please try again.';
  }
}

async function generateVideo(userMessage) {
  const prompt = userMessage
    .replace(/generate video of|create video of|make video of|generate a video of|create a video of|make a video of/gi, '')
    .trim();

  // Analyze prompt for visual themes
  const themes = {
    ocean: ['ocean','sea','wave','beach','water','surf','underwater'],
    forest: ['forest','tree','jungle','wood','nature','leaf','green'],
    space: ['space','star','galaxy','cosmos','universe','planet','nebula'],
    city: ['city','urban','building','street','night','neon','metropolis'],
    fire: ['fire','flame','lava','volcano','burn','hot','inferno'],
    sunset: ['sunset','sunrise','dawn','dusk','golden','horizon','sky'],
    snow: ['snow','ice','winter','blizzard','frost','cold','arctic'],
    rain: ['rain','storm','thunder','lightning','cloud','drizzle'],
    abstract: ['abstract','pattern','geometric','fractal','art','digital']
  };

  let detectedTheme = 'abstract';
  const promptLower = prompt.toLowerCase();
  for (const [theme, keywords] of Object.entries(themes)) {
    if (keywords.some(k => promptLower.includes(k))) {
      detectedTheme = theme;
      break;
    }
  }

  return `__CANVAS_VIDEO__${JSON.stringify({ prompt, theme: detectedTheme })}`;
}
