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
  try {
    const prompt = userMessage
      .replace(/generate video of|create video of|make video of|generate a video of|create a video of|make a video of/gi, '')
      .trim();

    // Get scene descriptions from AI
    const sceneResponse = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: 'You are a video scene designer. Given a prompt, return ONLY a JSON array of exactly 5 scene objects with fields: "scene" (number), "description" (short visual description for image generation, max 10 words), "duration" (seconds, between 3-8), "caption" (one sentence shown on screen). No other text, just valid JSON.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    const sceneData = await sceneResponse.json();
    let scenes = [];

    try {
      const text = sceneData.choices[0].message.content;
      const clean = text.replace(/```json|```/g, '').trim();
      scenes = JSON.parse(clean);
    } catch {
      scenes = [
        { scene: 1, description: prompt + ' opening wide shot', duration: 5, caption: 'Scene 1: ' + prompt },
        { scene: 2, description: prompt + ' close up detail', duration: 5, caption: 'Scene 2: Close-up view' },
        { scene: 3, description: prompt + ' dramatic angle', duration: 5, caption: 'Scene 3: Dramatic angle' },
        { scene: 4, description: prompt + ' golden hour lighting', duration: 5, caption: 'Scene 4: Beautiful lighting' },
        { scene: 5, description: prompt + ' cinematic finale', duration: 5, caption: 'Scene 5: Finale' }
      ];
    }

    // Generate image for each scene
    const seed = Math.floor(Math.random() * 1000000);
    const scenesWithImages = scenes.map((s, i) => ({
      ...s,
      imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(s.description + ', cinematic, 4k')}?width=768&height=432&seed=${seed + i}&nologo=true`
    }));

    return `__VIDEO_RESULT__${JSON.stringify({ prompt, scenes: scenesWithImages })}`;
  } catch (error) {
    return 'Sorry, video generation failed: ' + error.message;
  }
}
